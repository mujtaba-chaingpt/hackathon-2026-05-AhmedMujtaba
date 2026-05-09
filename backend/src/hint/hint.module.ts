import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { InterrogationTurn } from '../db/models/interrogation-turn.model';
import { HintController } from './hint.controller';
import { HintService } from './hint.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    SequelizeModule.forFeature([GameSession, InterrogationTurn]),
    AiModule,
  ],
  controllers: [HintController],
  providers: [HintService],
  exports: [HintService],
})
export class HintModule {}
