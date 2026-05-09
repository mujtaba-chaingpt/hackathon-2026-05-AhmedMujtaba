import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CaseService } from './case.service';
import { StartCaseDto } from './dto/start-case.dto';

@Controller('case')
@UseGuards(JwtAuthGuard)
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post('start')
  async startCase(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: StartCaseDto,
  ) {
    return this.caseService.startCase(user.id, dto);
  }

  /**
   * Player has finished reading the case file and is ready to start the timer.
   * Resets `expiresAt` so reading time does not consume the playable budget.
   */
  @Post(':sessionId/begin')
  async beginTimer(
    @CurrentUser() user: { id: string; email: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.caseService.beginTimer(sessionId, user.id);
  }

  @Get(':sessionId')
  async getSession(
    @CurrentUser() user: { id: string; email: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.caseService.getSession(sessionId, user.id);
  }
}
