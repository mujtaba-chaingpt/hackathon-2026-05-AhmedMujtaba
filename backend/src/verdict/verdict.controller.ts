import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VerdictService } from './verdict.service';
import { VerdictDto } from './dto/verdict.dto';

@Controller('verdict')
@UseGuards(JwtAuthGuard)
export class VerdictController {
  constructor(private readonly verdictService: VerdictService) {}

  @Post()
  async submitVerdict(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: VerdictDto,
  ) {
    return this.verdictService.submitVerdict(user.id, dto);
  }
}
