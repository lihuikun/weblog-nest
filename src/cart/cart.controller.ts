import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { CartService } from './cart.service';
import { AddCartDto } from './dto/add-cart.dto';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';

@ApiTags('购物车')
@ApiBearerAuth('bearer')
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post('add')
  @ApiOperation({ summary: '加入购物车' })
  @ApiBody({ type: AddCartDto })
  async add(
    @CurrentUserId() userId: number,
    @Body() dto: AddCartDto,
  ) {
    return this.cartService.add(userId, dto);
  }

  @Patch(':id/quantity')
  @ApiOperation({ summary: '修改购物车数量' })
  @ApiBody({ type: UpdateCartQuantityDto })
  async updateQuantity(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartQuantityDto,
  ) {
    return this.cartService.updateQuantity(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除购物车条目' })
  async remove(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cartService.remove(userId, id);
  }

  @Get()
  @ApiOperation({ summary: '获取购物车列表' })
  async findAll(@CurrentUserId() userId: number) {
    return this.cartService.findAll(userId);
  }
}
