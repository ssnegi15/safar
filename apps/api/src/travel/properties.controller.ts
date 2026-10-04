import {
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchPropertiesDto } from './search-query.dto';
import { TravelSearchService } from './travel-search.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(@Inject(TravelSearchService) private readonly travelSearchService: TravelSearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search synthetic accommodation inventory' })
  @ApiQuery({ type: SearchPropertiesDto })
  search(@Query() query: SearchPropertiesDto) {
    return this.travelSearchService.search({
      ...query,
      amenities: query.amenities ?? [],
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property and room types' })
  getProperty(@Param('id') propertyId: string) {
    return this.travelSearchService.getProperty(propertyId);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get a current synthetic availability snapshot' })
  getAvailability(
    @Param('id') propertyId: string,
    @Query('guests', new DefaultValuePipe(2), ParseIntPipe) guests: number,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    return this.travelSearchService.getAvailability(propertyId, guests, checkIn, checkOut);
  }
}
