import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketListDto } from '../dto/ticket-list.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Tickets')
@Controller({
  path: RESOURCES.TICKETS,
  version: '1',
})
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  @RequirePermissions(`${RESOURCES.TICKETS}:${PERMISSIONS.READ}`)
  findAll(@Query() listDto: TicketListDto) {
    return this.ticketsService.findAll(listDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @RequirePermissions(`${RESOURCES.TICKETS}:${PERMISSIONS.CREATE}`)
  create(@Body() createTicketDto: CreateTicketDto, @User() user: IUserSession) {
    return this.ticketsService.create(createTicketDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @RequirePermissions(`${RESOURCES.TICKETS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ticket by ID' })
  @RequirePermissions(`${RESOURCES.TICKETS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @User() user: IUserSession,
  ) {
    return this.ticketsService.update(id, updateTicketDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ticket by ID' })
  @RequirePermissions(`${RESOURCES.TICKETS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.ticketsService.remove(id, user);
  }
}
