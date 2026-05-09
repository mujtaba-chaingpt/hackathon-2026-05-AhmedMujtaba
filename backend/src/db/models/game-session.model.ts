import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from './user.model';
import { InterrogationTurn } from './interrogation-turn.model';

@Table({ tableName: 'game_sessions', timestamps: true })
export class GameSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  userId: string;

  @Column({
    type: DataType.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @Default('active')
  @Column({
    type: DataType.ENUM('active', 'won', 'lost', 'expired'),
    allowNull: false,
  })
  status: 'active' | 'won' | 'lost' | 'expired';

  @Column({ type: DataType.JSONB, allowNull: false, field: 'case_data' })
  caseData: any;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, field: 'hint_used' })
  hintUsed: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'coin_cost' })
  coinCost: number;

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  expiresAt: Date;

  @Column({ type: DataType.DATE, allowNull: false, field: 'started_at' })
  startedAt: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'ended_at' })
  endedAt: Date;

  @Column({ type: DataType.STRING, allowNull: true, field: 'accused_suspect_id' })
  accusedSuspectId: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt: Date;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => InterrogationTurn)
  interrogationTurns: InterrogationTurn[];
}
