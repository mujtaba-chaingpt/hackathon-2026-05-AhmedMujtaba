import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../db/models/user.model';
import { InsufficientCoinsError } from '../common/errors/game.exceptions';

@Injectable()
export class CoinService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    return user.coinBalance;
  }

  async deduct(userId: string, amount: number, transaction?: any): Promise<number> {
    const options: any = { transaction };

    const user = await this.userModel.findByPk(userId, options);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (user.coinBalance < amount) {
      throw new InsufficientCoinsError();
    }

    user.coinBalance = user.coinBalance - amount;
    await user.save(options);

    return user.coinBalance;
  }

  async award(userId: string, amount: number, transaction?: any): Promise<number> {
    const options: any = { transaction };

    const user = await this.userModel.findByPk(userId, options);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    user.coinBalance = user.coinBalance + amount;
    await user.save(options);

    return user.coinBalance;
  }
}
