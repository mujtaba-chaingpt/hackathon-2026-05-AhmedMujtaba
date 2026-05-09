import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { GameSession } from '../db/models/game-session.model';
import { User } from '../db/models/user.model';
import { CoinService } from '../coin/coin.service';
import { AiService } from '../ai/ai.service';
import {
  InsufficientCoinsError,
  SessionNotFoundError,
  SessionExpiredError,
  SessionNotActiveError,
} from '../common/errors/game.exceptions';
import { StartCaseDto } from './dto/start-case.dto';

const COIN_COSTS: Record<string, number> = {
  easy: 50,
  medium: 100,
  hard: 200,
};

const TIMERS_MS: Record<string, number> = {
  easy: 25 * 60 * 1000,
  medium: 35 * 60 * 1000,
  hard: 55 * 60 * 1000,
};

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly coinService: CoinService,
    private readonly aiService: AiService,
    private readonly sequelize: Sequelize,
  ) {}

  async startCase(
    userId: string,
    dto: StartCaseDto,
  ): Promise<{ sessionId: string; difficulty: string; expiresAt: Date; coinBalance: number; case: any }> {
    const { difficulty } = dto;
    const coinCost = COIN_COSTS[difficulty];

    // Pre-check balance before entering transaction
    const currentBalance = await this.coinService.getBalance(userId);
    if (currentBalance < coinCost) {
      throw new InsufficientCoinsError();
    }

    this.logger.log(`Starting ${difficulty} case for user ${userId}, cost: ${coinCost}`);

    // Generate case outside transaction to avoid long-held locks
    const caseData = await this.aiService.generateCase(difficulty);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TIMERS_MS[difficulty]);

    const session = await this.sequelize.transaction(async (t) => {
      const newBalance = await this.coinService.deduct(userId, coinCost, t);

      const gameSession = await this.gameSessionModel.create(
        {
          userId,
          difficulty,
          status: 'active',
          caseData,
          hintUsed: false,
          coinCost,
          expiresAt,
          startedAt: now,
        },
        { transaction: t },
      );

      return { gameSession, newBalance };
    });

    const publicCase = this.sanitizeCase(caseData);

    return {
      sessionId: session.gameSession.id,
      difficulty,
      expiresAt,
      coinBalance: session.newBalance,
      case: publicCase,
    };
  }

  /**
   * Start the countdown timer. Called when the player clicks "Begin Investigation"
   * inside the case file book — NOT at case creation. This way the time spent
   * reading the case file does not eat into the playable budget.
   *
   * Resets `expiresAt` to `now + difficulty_ms`. Idempotent: if the timer has
   * already been started recently, calling again just returns the current state
   * without resetting (prevents extending the timer by re-clicking).
   */
  async beginTimer(
    sessionId: string,
    userId: string,
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    const session = await this.gameSessionModel.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) throw new SessionNotFoundError();
    if (session.status !== 'active') throw new SessionNotActiveError();

    const now = new Date();

    // Idempotency: at case creation, `startedAt` and `createdAt` are written
    // together (within ~ms of each other). After beginTimer runs, `startedAt`
    // is bumped to a much later time. Use a 5-second tolerance to detect
    // "already begun" — re-clicking Begin Investigation must not extend the timer.
    const TOLERANCE_MS = 5_000;
    const createdAt = session.createdAt ?? session.startedAt;
    const alreadyBegun =
      session.startedAt &&
      session.startedAt.getTime() > createdAt.getTime() + TOLERANCE_MS;

    if (alreadyBegun) {
      return { sessionId: session.id, expiresAt: session.expiresAt };
    }

    const difficultyMs = TIMERS_MS[session.difficulty] ?? TIMERS_MS['medium'];
    const newExpiresAt = new Date(now.getTime() + difficultyMs);

    session.expiresAt = newExpiresAt;
    session.startedAt = now;
    await session.save();

    this.logger.log(
      `Timer started for session ${sessionId} (${session.difficulty}) — expires at ${newExpiresAt.toISOString()}`,
    );

    return { sessionId: session.id, expiresAt: newExpiresAt };
  }

  async getSession(
    sessionId: string,
    userId: string,
  ): Promise<{ sessionId: string; difficulty: string; status: string; hintUsed: boolean; expiresAt: Date; case: any }> {
    const session = await this.gameSessionModel.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Check expiry if still marked active
    if (session.status === 'active') {
      const now = new Date();
      if (now > session.expiresAt) {
        session.status = 'expired';
        await session.save();
        throw new SessionExpiredError();
      }
    }

    const publicCase = this.sanitizeCase(session.caseData);

    return {
      sessionId: session.id,
      difficulty: session.difficulty,
      status: session.status,
      hintUsed: session.hintUsed,
      expiresAt: session.expiresAt,
      case: publicCase,
    };
  }

  private sanitizeCase(caseData: any): any {
    if (!caseData) return null;

    const allChars = caseData.suspects || [];
    const suspects = allChars.filter((s: any) => s.role !== 'witness');
    const witnesses = allChars.filter((s: any) => s.role === 'witness');

    const sanitized = {
      setting: caseData.setting,
      victim: caseData.victim,
      crime_scene_description: caseData.crime_scene_description,
      initial_evidence: caseData.initial_evidence || [],
      // Intentionally omit: murderer_id, motive, how_it_was_done, how_it_was_concealed, key_clues, red_herrings
      suspects: suspects.map((s: any) => ({
        id: s.id,
        role: 'suspect',
        name: s.name,
        age: s.age,
        gender: s.gender,   // 'male' | 'female' — used by frontend TTS voice selection
        relationship_to_victim: s.relationship_to_victim,
        why_suspect: s.why_suspect,
        alibi: s.alibi,
        personality: s.personality,
        // Intentionally omit: private_truth, alibi_is_true, secrets, will_crack_if
      })),
      witnesses: witnesses.map((w: any) => ({
        id: w.id,
        role: 'witness',
        name: w.name,
        age: w.age,
        gender: w.gender,   // 'male' | 'female' — used by frontend TTS voice selection
        relationship_to_suspects: w.relationship_to_suspects,
        why_relevant: w.why_relevant,
        alibi: w.alibi,
        personality: w.personality,
        // Intentionally omit: private_truth, alibi_is_true, secrets, will_crack_if
      })),
    };

    return sanitized;
  }
}
