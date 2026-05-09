import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { GameSession } from '../db/models/game-session.model';
import { CoinService } from '../coin/coin.service';
import { AiService } from '../ai/ai.service';
import {
  SessionNotFoundError,
  SessionNotActiveError,
  SessionExpiredError,
  SuspectNotFoundError,
} from '../common/errors/game.exceptions';
import { VerdictDto } from './dto/verdict.dto';

@Injectable()
export class VerdictService {
  private readonly logger = new Logger(VerdictService.name);

  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    private readonly coinService: CoinService,
    private readonly aiService: AiService,
    private readonly sequelize: Sequelize,
  ) {}

  async submitVerdict(
    userId: string,
    dto: VerdictDto,
  ): Promise<{
    correct: boolean;
    reveal: string;
    coinBalance: number;
    coinsEarned: number;
    murdererName: string;
    murdererId: string;
    accusedName: string;
  }> {
    const { sessionId, accusedSuspectId } = dto;

    // Load session and verify ownership
    const session = await this.gameSessionModel.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Verify session is active (not already ended)
    if (session.status !== 'active') {
      throw new SessionNotActiveError();
    }

    // Check expiry
    const now = new Date();
    if (now > session.expiresAt) {
      session.status = 'expired';
      session.endedAt = now;
      await session.save();
      throw new SessionExpiredError();
    }

    const caseData = session.caseData;

    // Blank accusedSuspectId means the timer expired on the client — register as a loss.
    const isTimerExpiry = !accusedSuspectId;
    const correct = !isTimerExpiry && accusedSuspectId === caseData.murderer_id;

    // Find the accused suspect's name for the narrative; use murderer name on expiry for reveal
    const accusedSuspect = isTimerExpiry
      ? caseData.suspects?.find((s: any) => s.id === caseData.murderer_id)
      : caseData.suspects?.find((s: any) => s.id === accusedSuspectId);

    if (!accusedSuspect && !isTimerExpiry) {
      throw new SuspectNotFoundError();
    }

    const accusedName = accusedSuspect?.name ?? 'Unknown';

    this.logger.log(
      `Verdict submitted for session ${sessionId}: accused=${accusedName}, correct=${correct}`,
    );

    // Generate cinematic reveal narrative outside transaction
    const reveal = await this.aiService.generateVerdictReveal(
      caseData,
      accusedName,
      correct,
    );

    const COIN_REWARDS: Record<string, number> = { easy: 150, medium: 300, hard: 200 };
    const coinsEarned = correct ? (COIN_REWARDS[session.difficulty] ?? session.coinCost * 2) : 0;

    // Update session and award coins in transaction
    let finalBalance!: number;

    await this.sequelize.transaction(async (t) => {
      // Award coins only if correct (coin cost was already deducted at case start)
      if (correct) {
        finalBalance = await this.coinService.award(userId, coinsEarned, t);
      } else {
        finalBalance = await this.coinService.getBalance(userId);
      }

      // Update session
      await session.update(
        {
          status: correct ? 'won' : 'lost',
          endedAt: now,
          accusedSuspectId,
        },
        { transaction: t },
      );
    });

    // If transaction didn't set balance (lost case), get it now
    if (finalBalance === undefined) {
      finalBalance = await this.coinService.getBalance(userId);
    }

    // Always reveal the actual murderer's identity in the response so the result page
    // can show it explicitly (separate from the AI-generated narrative reveal).
    const murderer = caseData.suspects?.find(
      (s: any) => s.id === caseData.murderer_id,
    );
    const murdererName = murderer?.name ?? 'Unknown';
    const murdererId = caseData.murderer_id ?? '';

    return {
      correct,
      reveal,
      coinBalance: finalBalance,
      coinsEarned,
      murdererName,
      murdererId,
      accusedName,
    };
  }
}
