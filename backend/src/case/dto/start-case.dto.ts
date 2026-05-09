import { IsEnum } from 'class-validator';

export class StartCaseDto {
  @IsEnum(['easy', 'medium', 'hard'], {
    message: 'difficulty must be one of: easy, medium, hard',
  })
  difficulty: 'easy' | 'medium' | 'hard';
}
