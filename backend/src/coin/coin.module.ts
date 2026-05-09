import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../db/models/user.model';
import { CoinService } from './coin.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
