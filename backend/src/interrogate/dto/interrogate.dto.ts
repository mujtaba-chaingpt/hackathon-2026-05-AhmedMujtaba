import { IsString, IsUUID, MaxLength } from 'class-validator';

export class InterrogateDto {
  @IsUUID('4', { message: 'sessionId must be a valid UUID' })
  sessionId: string;

  @IsString({ message: 'suspectId must be a string' })
  suspectId: string;

  @IsString({ message: 'question must be a string' })
  @MaxLength(500, { message: 'question must not exceed 500 characters' })
  question: string;
}
