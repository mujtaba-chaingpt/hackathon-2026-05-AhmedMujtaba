import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { CaseModule } from './case/case.module';
import { InterrogateModule } from './interrogate/interrogate.module';
import { HintModule } from './hint/hint.module';
import { VerdictModule } from './verdict/verdict.module';
import { CoinModule } from './coin/coin.module';
import { AiModule } from './ai/ai.module';
import { AppLoggerService } from './common/logger/app-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AiModule,
    CoinModule,
    AuthModule,
    CaseModule,
    InterrogateModule,
    HintModule,
    VerdictModule,
  ],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class AppModule {}
