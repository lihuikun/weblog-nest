import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { Pagination, PaginationParams } from '../common/decorators/pagination.decorator';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './entities/order.entity';
import { OrderService } from './order.service';

@ApiTags('订单管理')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @ApiOperation({ summary: '创建订单（提交菜单ID和数量）' })
  @ApiBody({ type: CreateOrderDto })
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(userId, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新订单状态（制作中/制作完成）' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(userId, id, dto);
  }

  @Get('team/history')
  @ApiOperation({ summary: '团队历史订单分页查询' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  async teamHistory(
    @CurrentUserId() userId: number,
    @Pagination() pagination: PaginationParams,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.teamHistory(userId, pagination, status);
  }
}
