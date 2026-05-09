import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HintService } from './hint.service';
import { HintDto } from './dto/hint.dto';

@Controller('hint')
@UseGuards(JwtAuthGuard)
export class HintController {
  constructor(private readonly hintService: HintService) {}

  @Post()
  async requestHint(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: HintDto,
  ) {
    return this.hintService.requestHint(user.id, dto);
  }
}
