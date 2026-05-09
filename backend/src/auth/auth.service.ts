import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../db/models/user.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'email', 'name', 'picture', 'coinBalance', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
