import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { InterrogationTurn } from '../db/models/interrogation-turn.model';
import { AiService } from '../ai/ai.service';
import {
  SessionNotFoundError,
  SessionNotActiveError,
  SessionExpiredError,
  HintAlreadyUsedError,
} from '../common/errors/game.exceptions';
import { HintDto } from './dto/hint.dto';

@Injectable()
export class HintService {
  private readonly logger = new Logger(HintService.name);

  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    @InjectModel(InterrogationTurn)
    private readonly interrogationTurnModel: typeof InterrogationTurn,
    private readonly aiService: AiService,
  ) {}

  async requestHint(
    userId: string,
    dto: HintDto,
  ): Promise<{ hint: string }> {
    const { sessionId } = dto;

    // Load session and verify ownership
    const session = await this.gameSessionModel.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new SessionNotFoundError();
    }

    // Verify session is active
    if (session.status !== 'active') {
      throw new SessionNotActiveError();
    }

    // Check expiry
    const now = new Date();
    if (now > session.expiresAt) {
      session.status = 'expired';
      await session.save();
      throw new SessionExpiredError();
    }

    // Check if hint already used
    if (session.hintUsed) {
      throw new HintAlreadyUsedError();
    }

    // Load all interrogation turns for context
    const allTurns = await this.interrogationTurnModel.findAll({
      where: { gameSessionId: sessionId },
      order: [['created_at', 'ASC']],
    });

    const conversationHistory = allTurns.map((turn) => ({
      suspectId: turn.suspectId,
      question: turn.question,
      answer: turn.answer,
    }));

    this.logger.log(`Generating hint for session ${sessionId}`);

    // Generate hint via AI
    const hint = await this.aiService.generateHint(
      session.caseData,
      conversationHistory,
    );

    // Mark hint as used
    session.hintUsed = true;
    await session.save();

    return { hint };
  }
}
