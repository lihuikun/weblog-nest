import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginationParams } from '../common/decorators/pagination.decorator';
import { Menu } from '../menu/entities/menu.entity';
import { TeamService } from '../team/team.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly teamService: TeamService,
  ) { }

  async create(userId: number, dto: CreateOrderDto) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    if (!dto.items?.length) {
      throw new BadRequestException('订单菜品不能为空');
    }

    const mergedMap = new Map<number, number>();
    for (const item of dto.items) {
      mergedMap.set(item.menuId, (mergedMap.get(item.menuId) || 0) + item.quantity);
    }
    const mergedItems = [...mergedMap.entries()].map(([menuId, quantity]) => ({ menuId, quantity }));

    const menuIds = mergedItems.map(item => item.menuId);
    const menus = await this.menuRepository.find({
      where: { id: In(menuIds), teamId },
    });
    if (menus.length !== menuIds.length) {
      throw new BadRequestException('存在无效菜单，无法创建订单');
    }

    const order = this.orderRepository.create({
      orderNo: this.generateOrderNo(userId),
      teamId,
      userId,
      status: OrderStatus.MAKING,
    });
    const savedOrder = await this.orderRepository.save(order);

    const orderItems = mergedItems.map(item => this.orderItemRepository.create({
      orderId: savedOrder.id,
      menuId: item.menuId,
      quantity: item.quantity,
    }));
    await this.orderItemRepository.save(orderItems);

    return this.getOrderDetail(savedOrder, orderItems, menus);
  }

  async updateStatus(userId: number, id: number, dto: UpdateOrderStatusDto) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const order = await this.orderRepository.findOne({ where: { id, teamId } });
    if (!order) throw new NotFoundException('订单不存在');
    order.status = dto.status;
    return this.orderRepository.save(order);
  }

  async teamHistory(userId: number, pagination: PaginationParams, status?: OrderStatus) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.teamId = :teamId', { teamId })
      .orderBy('order.id', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder.getManyAndCount();
    if (!orders.length) {
      return { list: [], total, page, pageSize };
    }

    const orderIds = orders.map(order => order.id);
    const orderItems = await this.orderItemRepository.find({
      where: { orderId: In(orderIds) },
      order: { id: 'ASC' },
    });
    const menuIds = [...new Set(orderItems.map(item => item.menuId))];
    const menus = await this.menuRepository.find({ where: { id: In(menuIds), teamId } });
    const menuMap = new Map(menus.map(menu => [menu.id, menu]));

    const itemsByOrderId = new Map<number, OrderItem[]>();
    for (const item of orderItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    return {
      total,
      page,
      pageSize,
      list: orders.map(order => {
        const items = itemsByOrderId.get(order.id) || [];
        return this.getOrderDetail(order, items, menus, menuMap);
      }),
    };
  }

  async countByTeamId(teamId: number): Promise<number> {
    return this.orderRepository.count({ where: { teamId } });
  }

  private getOrderDetail(
    order: Order,
    items: OrderItem[],
    menus: Menu[],
    menuMapArg?: Map<number, Menu>,
  ) {
    const menuMap = menuMapArg || new Map(menus.map(menu => [menu.id, menu]));
    return {
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      teamId: order.teamId,
      userId: order.userId,
      createTime: order.createTime,
      updatedTime: order.updatedTime,
      items: items.map(item => {
        const menu = menuMap.get(item.menuId);
        return {
          id: item.id,
          menuId: item.menuId,
          quantity: item.quantity,
          menu: menu ? {
            id: menu.id,
            title: menu.title,
            cover: menu.cover,
            price: menu.price,
            duration: menu.duration,
            difficulty: menu.difficulty,
            recommendation: menu.recommendation,
          } : null,
        };
      }),
    };
  }

  private generateOrderNo(userId: number): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timePart = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `OD${datePart}${timePart}${userId}${randomPart}`;
  }
}
