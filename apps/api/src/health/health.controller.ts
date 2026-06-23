import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface HealthResponse {
  status: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Проверка доступности API' })
  @ApiResponse({ status: 200, description: 'API доступен' })
  public getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
