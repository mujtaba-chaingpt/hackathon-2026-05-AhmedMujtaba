import { IsUUID } from 'class-validator';

export class HintDto {
  @IsUUID('4', { message: 'sessionId must be a valid UUID' })
  sessionId: string;
}
