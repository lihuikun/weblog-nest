import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Menu } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { PaginationParams } from '../common/decorators/pagination.decorator';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
  ) {}

  async create(userId: number, dto: CreateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const { category: _omitCategory, ...fields } = dto;
    const created = await this.prisma.menu.create({
      data: {
        teamId,
        userId,
        title: fields.title,
        categoryId: 1,
        shareToSquare: fields.shareToSquare,
        description: fields.description,
        steps: fields.steps ?? undefined,
        ingredients: fields.ingredients ?? undefined,
        cover: fields.cover,
        price: fields.price,
        recommendation: fields.recommendation,
        duration: fields.duration,
        difficulty: fields.difficulty,
      },
    });

    if (!created.squareMenuId) {
      return this.prisma.menu.update({
        where: { id: created.id },
        data: { squareMenuId: created.id },
      });
    }

    return created;
  }

  async findAll(userId: number, keyword?: string, categoryId?: number): Promise<Menu[]> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const cid =
      categoryId !== undefined && categoryId !== null && !Number.isNaN(Number(categoryId))
        ? Number(categoryId)
        : undefined;

    return this.prisma.menu.findMany({
      where: {
        teamId,
        ...(keyword ? { title: { contains: keyword } } : {}),
        ...(cid !== undefined ? { categoryId: cid } : {}),
      },
      orderBy: { id: 'desc' },
    });
  }

  async randomFiveMenus(userId?: number): Promise<Menu[]> {
    if (userId) {
      const { teamId } = await this.teamService.getMyTeam(userId);
      return this.prisma.$queryRaw<Menu[]>`
        SELECT * FROM \`menu\` WHERE \`teamId\` = ${teamId} ORDER BY RAND() LIMIT 5
      `;
    }
    return this.prisma.$queryRaw<Menu[]>`
      SELECT * FROM \`menu\` WHERE \`shareToSquare\` = true ORDER BY RAND() LIMIT 5
    `;
  }

  async findSquareMenus(pagination: PaginationParams, userId?: number, keyword?: string) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where = {
      shareToSquare: true,
      ...(keyword ? { title: { contains: keyword } } : {}),
    };

    const [list, total] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.menu.count({ where }),
    ]);

    if (!list.length) {
      return { list: [], total, page, pageSize };
    }

    const usersInfo = await this.userService.getUsersBasicInfo(
      [...new Set(list.map(item => item.userId).filter((id): id is number => id != null))],
    );

    let addedIdSet = new Set<number>();
    if (userId) {
      const { teamId } = await this.teamService.getMyTeam(userId);
      const squareIds = list.map(item => item.id);
      const addedMenus = await this.prisma.menu.findMany({
        where: {
          teamId,
          squareMenuId: { in: squareIds },
        },
        select: { squareMenuId: true },
      });
      addedIdSet = new Set(addedMenus.map(item => item.squareMenuId).filter((id): id is number => id != null));
    }

    return {
      total,
      page,
      pageSize,
      list: list.map(item => ({
        ...item,
        user: item.userId
          ? usersInfo[item.userId] || {
              id: item.userId,
              nickname: '未知用户',
              avatarUrl: '',
            }
          : null,
        addedToTeam: addedIdSet.has(item.id),
      })),
    };
  }

  async findOne(userId: number, id: number): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const menu = await this.prisma.menu.findFirst({ where: { id, teamId } });
    if (!menu) throw new NotFoundException('菜单不存在');

    if (!menu.squareMenuId) {
      return this.prisma.menu.update({
        where: { id: menu.id },
        data: { squareMenuId: menu.id },
      });
    }

    return menu;
  }

  async addSquareMenuToTeam(userId: number, squareMenuId: number, categoryId: number): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, teamId },
    });
    if (!category) {
      throw new NotFoundException('分类不存在或不属于当前团队');
    }

    const squareMenu = await this.prisma.menu.findFirst({
      where: { id: squareMenuId, shareToSquare: true },
    });
    if (!squareMenu) {
      throw new NotFoundException('广场菜单不存在');
    }

    if (squareMenu.teamId === teamId) {
      throw new BadRequestException('该菜单已在当前团队中');
    }

    const existing = await this.prisma.menu.findFirst({
      where: { teamId, squareMenuId },
    });
    if (existing) {
      throw new BadRequestException('该菜单已添加到当前团队');
    }

    return this.prisma.menu.create({
      data: {
        teamId,
        title: squareMenu.title,
        categoryId,
        shareToSquare: false,
        squareMenuId: squareMenu.id,
        description: squareMenu.description,
        steps: squareMenu.steps ?? undefined,
        ingredients: squareMenu.ingredients ?? undefined,
        cover: squareMenu.cover,
        price: squareMenu.price,
        recommendation: squareMenu.recommendation,
        duration: squareMenu.duration,
        difficulty: squareMenu.difficulty,
      },
    });
  }

  async update(userId: number, id: number, dto: UpdateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const { category: _omit, ...rest } = dto as UpdateMenuDto & { category?: string };

    const data: {
      title?: string;
      shareToSquare?: boolean;
      description?: string;
      steps?: string[] | null;
      ingredients?: string[] | null;
      cover?: string;
      price?: number;
      recommendation?: number;
      duration?: string | null;
      difficulty?: string | null;
      userId?: number;
    } = { userId };
    if (rest.title !== undefined) data.title = rest.title;
    if (rest.shareToSquare !== undefined) data.shareToSquare = rest.shareToSquare;
    if (rest.description !== undefined) data.description = rest.description;
    if (rest.steps !== undefined) data.steps = rest.steps;
    if (rest.ingredients !== undefined) data.ingredients = rest.ingredients;
    if (rest.cover !== undefined) data.cover = rest.cover;
    if (rest.price !== undefined) data.price = rest.price;
    if (rest.recommendation !== undefined) data.recommendation = rest.recommendation;
    if (rest.duration !== undefined) data.duration = rest.duration;
    if (rest.difficulty !== undefined) data.difficulty = rest.difficulty;

    const r = await this.prisma.menu.updateMany({
      where: { id, teamId },
      data,
    });
    if (r.count === 0) throw new NotFoundException('菜单不存在');

    const updated = await this.prisma.menu.findFirst({ where: { id, teamId } });
    if (!updated) throw new NotFoundException('菜单不存在');
    return updated;
  }

  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const result = await this.prisma.menu.deleteMany({ where: { id, teamId } });
    if (result.count === 0) throw new NotFoundException('菜单不存在');
    return { success: true };
  }
}
