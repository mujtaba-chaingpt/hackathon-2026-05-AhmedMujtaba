import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './models/user.model';
import { GameSession } from './models/game-session.model';
import { InterrogationTurn } from './models/interrogation-turn.model';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: +config.get<string>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        models: [User, GameSession, InterrogationTurn],
        autoLoadModels: true,
        synchronize: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging:
          config.get<string>('NODE_ENV') === 'development' ? console.log : false,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
