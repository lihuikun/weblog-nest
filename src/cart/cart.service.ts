import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamService } from '../team/team.service';
import { Menu } from '../menu/entities/menu.entity';
import { Cart } from './entities/cart.entity';
import { AddCartDto } from './dto/add-cart.dto';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly teamService: TeamService,
  ) { }

  async add(userId: number, dto: AddCartDto): Promise<Cart> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const { menuId, quantity = 1 } = dto;

    const menu = await this.menuRepository.findOne({ where: { id: menuId, teamId } });
    if (!menu) throw new BadRequestException('菜单不存在或不属于当前团队');

    const existing = await this.cartRepository.findOne({
      where: { userId, teamId, menuId },
    });
    if (existing) {
      existing.quantity += quantity;
      return this.cartRepository.save(existing);
    }

    const cart = this.cartRepository.create({ userId, teamId, menuId, quantity });
    return this.cartRepository.save(cart);
  }

  async updateQuantity(userId: number, id: number, dto: UpdateCartQuantityDto): Promise<Cart> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const cart = await this.cartRepository.findOne({ where: { id, userId, teamId } });
    if (!cart) throw new NotFoundException('购物车记录不存在');

    cart.quantity = dto.quantity;
    return this.cartRepository.save(cart);
  }

  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const result = await this.cartRepository.delete({ id, userId, teamId });
    if (result.affected === 0) throw new NotFoundException('购物车记录不存在');
    return { success: true };
  }

  async findAll(userId: number) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const list = await this.cartRepository.find({
      where: { userId, teamId },
      order: { id: 'DESC' },
    });

    if (!list.length) {
      return { list: [], total: 0 };
    }

    const menus = await this.menuRepository.find({
      where: { teamId, id: In(list.map(item => item.menuId)) },
    });
    const menuMap = new Map(menus.map(menu => [menu.id, menu]));

    return {
      total: list.length,
      list: list.map(item => {
        const menu = menuMap.get(item.menuId);
        return {
          id: item.id,
          menuId: item.menuId,
          quantity: item.quantity,
          createTime: item.createTime,
          updatedTime: item.updatedTime,
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
}
