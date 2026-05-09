import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { GameSession } from './game-session.model';

@Table({ tableName: 'interrogation_turns', timestamps: true, updatedAt: false, createdAt: 'created_at' })
export class InterrogationTurn extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => GameSession)
  @Column({ type: DataType.UUID, allowNull: false, field: 'game_session_id' })
  gameSessionId: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'suspect_id' })
  suspectId: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  question: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  answer: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt: Date;

  @BelongsTo(() => GameSession)
  gameSession: GameSession;
}
