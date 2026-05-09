import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterrogateService } from './interrogate.service';
import { InterrogateDto } from './dto/interrogate.dto';

@Controller('interrogate')
@UseGuards(JwtAuthGuard)
export class InterrogateController {
  constructor(private readonly interrogateService: InterrogateService) {}

  @Post()
  async interrogate(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: InterrogateDto,
  ) {
    return this.interrogateService.interrogate(user.id, dto);
  }
}
