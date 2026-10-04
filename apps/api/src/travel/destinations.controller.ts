import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TravelSearchService } from './travel-search.service';

@ApiTags('destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(@Inject(TravelSearchService) private readonly travelSearchService: TravelSearchService) {}

  @Get()
  @ApiOperation({ summary: 'List supported destinations' })
  getDestinations() {
    return this.travelSearchService.getDestinations();
  }
}
