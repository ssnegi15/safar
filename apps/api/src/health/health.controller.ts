import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Basic service status' })
  getStatus(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('live')
  getLiveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  getReadiness(): { status: 'ok'; dependencies: 'postgres' } {
    return { status: 'ok', dependencies: 'postgres' };
  }
}
