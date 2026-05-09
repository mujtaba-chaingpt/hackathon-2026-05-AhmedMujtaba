import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GameSession } from '../db/models/game-session.model';
import { VerdictController } from './verdict.controller';
import { VerdictService } from './verdict.service';
import { CoinModule } from '../coin/coin.module';
import { AiModule } from '../ai/ai.module';

/**
 * The Sequelize instance (used for transactions) is globally provided by
 * DatabaseModule (SequelizeModule.forRootAsync) and can be injected directly
 * into any provider via `@Inject(Sequelize)` or constructor type injection.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([GameSession]),
    CoinModule,
    AiModule,
  ],
  controllers: [VerdictController],
  providers: [VerdictService],
  exports: [VerdictService],
})
export class VerdictModule {}
