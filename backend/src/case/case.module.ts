import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { User } from '../db/models/user.model';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';
import { CoinModule } from '../coin/coin.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    SequelizeModule.forFeature([GameSession, User]),
    CoinModule,
    AiModule,
  ],
  controllers: [CaseController],
  providers: [CaseService],
  exports: [CaseService],
})
export class CaseModule {}
