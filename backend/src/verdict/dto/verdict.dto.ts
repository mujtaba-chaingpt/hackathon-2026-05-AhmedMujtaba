import { IsString, IsUUID } from 'class-validator';

export class VerdictDto {
  @IsUUID('4', { message: 'sessionId must be a valid UUID' })
  sessionId: string;

  @IsString({ message: 'accusedSuspectId must be a string' })
  accusedSuspectId: string;
}
