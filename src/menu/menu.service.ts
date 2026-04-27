import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TeamService } from '../team/team.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entities/menu.entity';
import { PaginationParams } from '../common/decorators/pagination.decorator';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly teamService: TeamService,
  ) { }

  async create(userId: number, dto: CreateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const menu = this.menuRepository.create({ ...dto, teamId });
    const saved = await this.menuRepository.save(menu);

    // 新增时自动补记录菜单广场菜单ID（默认使用当前菜单ID）。
    if (!saved.squareMenuId) {
      saved.squareMenuId = saved.id;
      await this.menuRepository.save(saved);
    }

    return saved;
  }

  async findAll(userId: number): Promise<Menu[]> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.menuRepository.find({
      where: { teamId },
      order: { id: 'DESC' },
    });
  }

  async findSquareMenus(pagination: PaginationParams, userId?: number) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.shareToSquare = :shareToSquare', { shareToSquare: true })
      .orderBy('menu.id', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();
    if (!list.length) {
      return { list: [], total, page, pageSize };
    }

    let addedIdSet = new Set<number>();
    if (userId) {
      const { teamId } = await this.teamService.getMyTeam(userId);
      const squareIds = list.map(item => item.id);
      const addedMenus = await this.menuRepository.find({
        where: {
          teamId,
          squareMenuId: In(squareIds),
        },
        select: ['squareMenuId'],
      });
      addedIdSet = new Set(addedMenus.map(item => item.squareMenuId).filter(Boolean));
    }

    return {
      total,
      page,
      pageSize,
      list: list.map(item => ({
        ...item,
        addedToTeam: addedIdSet.has(item.id),
      })),
    };
  }

  async findOne(userId: number, id: number): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const menu = await this.menuRepository.findOne({ where: { id, teamId } });
    if (!menu) throw new NotFoundException('菜单不存在');

    // 查看详情时，如果未记录过菜单广场菜单ID则自动补记。
    if (!menu.squareMenuId) {
      menu.squareMenuId = menu.id;
      await this.menuRepository.save(menu);
    }

    return menu;
  }

  async update(userId: number, id: number, dto: UpdateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    await this.menuRepository.update({ id, teamId }, dto);
    const updated = await this.menuRepository.findOne({ where: { id, teamId } });
    if (!updated) throw new NotFoundException('菜单不存在');
    return updated;
  }

  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const result = await this.menuRepository.delete({ id, teamId });
    if (result.affected === 0) throw new NotFoundException('菜单不存在');
    return { success: true };
  }
}
