import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { InterrogationTurn } from '../db/models/interrogation-turn.model';
import { InterrogateController } from './interrogate.controller';
import { InterrogateService } from './interrogate.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    SequelizeModule.forFeature([GameSession, InterrogationTurn]),
    AiModule,
  ],
  controllers: [InterrogateController],
  providers: [InterrogateService],
  exports: [InterrogateService],
})
export class InterrogateModule {}
