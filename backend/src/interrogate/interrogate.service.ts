import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { InterrogationTurn } from '../db/models/interrogation-turn.model';
import { AiService } from '../ai/ai.service';
import {
  SessionNotFoundError,
  SessionNotActiveError,
  SessionExpiredError,
  SuspectNotFoundError,
} from '../common/errors/game.exceptions';
import { InterrogateDto } from './dto/interrogate.dto';

@Injectable()
export class InterrogateService {
  private readonly logger = new Logger(InterrogateService.name);

  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    @InjectModel(InterrogationTurn)
    private readonly interrogationTurnModel: typeof InterrogationTurn,
    private readonly aiService: AiService,
  ) {}

  async interrogate(
    userId: string,
    dto: InterrogateDto,
  ): Promise<{ answer: string; suspectName: string }> {
    const { sessionId, suspectId, question } = dto;

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

    // Find the suspect in case data
    const suspect = session.caseData?.suspects?.find(
      (s: any) => s.id === suspectId,
    );

    if (!suspect) {
      throw new SuspectNotFoundError();
    }

    // Load last 10 turns for this specific suspect (for conversation context)
    const recentTurns = await this.interrogationTurnModel.findAll({
      where: { gameSessionId: sessionId, suspectId },
      order: [['created_at', 'ASC']],
      limit: 10,
    });

    const conversationHistory = recentTurns.map((turn) => ({
      question: turn.question,
      answer: turn.answer,
    }));

    this.logger.log(
      `Interrogating suspect ${suspect.name} in session ${sessionId}`,
    );

    // Generate AI response
    const answer = await this.aiService.generateInterrogationResponse(
      suspect,
      conversationHistory,
      question,
    );

    // Save this turn to DB
    await this.interrogationTurnModel.create({
      gameSessionId: sessionId,
      suspectId,
      question,
      answer,
    });

    return { answer, suspectName: suspect.name };
  }
}
