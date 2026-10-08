import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { In, Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { SquareCategory } from '../square-category/entities/square-category.entity';
import { TeamService } from '../team/team.service';
import { UserService } from '../user/user.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entities/menu.entity';
import { PaginationParams } from '../common/decorators/pagination.decorator';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(SquareCategory)
    private readonly squareCategoryRepository: Repository<SquareCategory>,
    private readonly teamService: TeamService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async create(userId: number, dto: CreateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const menu = this.menuRepository.create({ ...dto, teamId, userId });
    const saved = await this.menuRepository.save(menu);

    // 新增时自动补记录菜单广场菜单ID（默认使用当前菜单ID）。
    if (!saved.squareMenuId) {
      saved.squareMenuId = saved.id;
      await this.menuRepository.save(saved);
    }

    // 开启分享到广场时，邮件通知管理员
    if (saved.shareToSquare) {
      void this.sendSquareShareEmail(saved, userId);
    }

    return saved;
  }

  async findAll(userId: number, keyword?: string, categoryId?: number): Promise<Menu[]> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.teamId = :teamId', { teamId })
      .orderBy('menu.id', 'DESC');

    if (keyword) {
      queryBuilder.andWhere('menu.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    if (categoryId !== undefined && categoryId !== null) {
      queryBuilder.andWhere('menu.categoryId = :categoryId', { categoryId: categoryId });
    }

    return queryBuilder.getMany();
  }

  async randomFiveMenus(userId?: number): Promise<Menu[]> {
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .take(5);

    if (userId) {
      const { teamId } = await this.teamService.getMyTeam(userId);
      queryBuilder.where('menu.teamId = :teamId', { teamId });
    } else {
      queryBuilder.where('menu.shareToSquare = :shareToSquare', { shareToSquare: true });
    }

    const total = await queryBuilder.clone().getCount();
    if (total === 0) {
      return [];
    }

    const skip = total > 5 ? Math.floor(Math.random() * (total - 4)) : 0;
    queryBuilder
      .orderBy('menu.id', 'DESC')
      .skip(skip);

    return queryBuilder.getMany();
  }

  async findSquareMenus(
    pagination: PaginationParams,
    userId?: number,
    keyword?: string,
    squareCategoryId?: number,
  ) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.shareToSquare = :shareToSquare', { shareToSquare: true })
      .orderBy('menu.id', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (keyword) {
      queryBuilder.andWhere('menu.title LIKE :keyword', { keyword: `%${keyword}%` });
    }

    if (squareCategoryId !== undefined && squareCategoryId !== null) {
      queryBuilder.andWhere('menu.squareCategoryId = :squareCategoryId', { squareCategoryId });
    }

    // getManyAndCount internally executes these queries in sequence. They are
    // independent, so run them concurrently to shorten the list endpoint's
    // database wait time.
    const [list, total] = await Promise.all([
      queryBuilder.getMany(),
      queryBuilder.clone().getCount(),
    ]);
    if (!list.length) {
      return { list: [], total, page, pageSize };
    }

    const usersInfoPromise = this.userService.getUsersBasicInfo(
      [...new Set(list.map(item => item.userId).filter(id => id))],
    );

    const addedIdSetPromise = userId
      ? this.teamService.getMyTeam(userId).then(async ({ teamId }) => {
          const squareIds = list.map(item => item.id);
          const addedMenus = await this.menuRepository.find({
            where: {
              teamId,
              squareMenuId: In(squareIds),
            },
            select: ['squareMenuId'],
          });
          return new Set(
            addedMenus.map(item => item.squareMenuId).filter(Boolean),
          );
        })
      : Promise.resolve(new Set<number>());

    const [usersInfo, addedIdSet] = await Promise.all([
      usersInfoPromise,
      addedIdSetPromise,
    ]);

    return {
      total,
      page,
      pageSize,
      list: list.map(item => ({
        ...item,
        user: item.userId ? (usersInfo[item.userId] || {
          id: item.userId,
          nickname: '未知用户',
          avatarUrl: '',
        }) : null,
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

  async addSquareMenuToTeam(
    userId: number,
    squareMenuId: number,
    categoryId: number,
  ): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);

    const [category, squareMenu] = await Promise.all([
      this.categoryRepository.findOne({
        where: { id: categoryId, teamId },
      }),
      this.menuRepository.findOne({
        where: { id: squareMenuId, shareToSquare: true },
      }),
    ]);

    if (!category) {
      throw new NotFoundException('分类不存在或不属于当前团队');
    }
    if (!squareMenu) {
      throw new NotFoundException('广场菜单不存在');
    }

    // 本团队菜单不需要重复添加
    if (squareMenu.teamId === teamId) {
      throw new BadRequestException('该菜单已在当前团队中');
    }

    const existingCount = await this.menuRepository.count({
      where: { teamId, squareMenuId },
    });
    if (existingCount > 0) {
      throw new BadRequestException('该菜单已添加到当前团队');
    }

    const newMenu = this.menuRepository.create({
      teamId,
      title: squareMenu.title,
      categoryId,
      shareToSquare: false,
      squareMenuId: squareMenu.id,
      description: squareMenu.description,
      steps: squareMenu.steps,
      ingredients: squareMenu.ingredients,
      cover: squareMenu.cover,
      price: squareMenu.price,
      recommendation: squareMenu.recommendation,
      duration: squareMenu.duration,
      difficulty: squareMenu.difficulty,
    });

    return this.menuRepository.save(newMenu);
  }

  async update(userId: number, id: number, dto: UpdateMenuDto): Promise<Menu> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const before = await this.menuRepository.findOne({ where: { id, teamId } });
    await this.menuRepository.update({ id, teamId }, { ...dto, userId });
    const updated = await this.menuRepository.findOne({ where: { id, teamId } });
    if (!updated) throw new NotFoundException('菜单不存在');

    // 编辑时从关闭改为开启分享到广场，邮件通知管理员
    if (updated.shareToSquare && !before?.shareToSquare) {
      void this.sendSquareShareEmail(updated, userId);
    }

    return updated;
  }

  // 仅超级管理员可调用（由 RoleGuard 保证），修改广场菜单的广场分类
  async updateSquareCategory(squareMenuId: number, squareCategoryId: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id: squareMenuId, shareToSquare: true },
    });
    if (!menu) throw new NotFoundException('广场菜单不存在');

    const squareCategory = await this.squareCategoryRepository.findOne({
      where: { id: squareCategoryId },
    });
    if (!squareCategory) throw new NotFoundException('广场分类不存在');

    menu.squareCategoryId = squareCategoryId;
    return this.menuRepository.save(menu);
  }

  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    const { teamId } = await this.teamService.getMyTeam(userId);
    const result = await this.menuRepository.delete({ id, teamId });
    if (result.affected === 0) throw new NotFoundException('菜单不存在');
    return { success: true };
  }

  private async sendSquareShareEmail(menu: Menu, userId: number): Promise<void> {
    try {
      const recipient =
        this.configService.get<string>('BACKUP_EMAIL') ||
        'lihk180542@gmail.com';
      const sender = this.configService.get<string>('EMAIL_USER');
      if (!sender) {
        this.logger.warn('EMAIL_USER 未配置，跳过广场分享邮件');
        return;
      }

      let sharer = '未知用户';
      try {
        const usersInfo = await this.userService.getUsersBasicInfo([userId]);
        const u = usersInfo[userId];
        if (u) sharer = u.nickname || `用户${u.id}`;
      } catch { /* 忽略 */ }

      const ingredients = Array.isArray(menu.ingredients)
        ? menu.ingredients.map(i => `<li>${i}</li>`).join('')
        : '';
      const steps = Array.isArray(menu.steps)
        ? menu.steps.map((s, idx) => `<li><strong>第${idx + 1}步：</strong>${s}</li>`).join('')
        : '';

      const coverHtml = menu.cover
        ? `<img src="${menu.cover}" style="max-width:320px;border-radius:8px;margin:12px 0;" />`
        : '';

      const priceHtml = typeof menu.price === 'number'
        ? `<div style="margin-top:8px;color:#d48806;font-weight:600;font-size:16px;">价格：¥${menu.price.toFixed(2)}</div>`
        : '';

      const timeLabel = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

      await this.transporter.sendMail({
        from: `"前端的日常" <${sender}>`,
        to: recipient,
        subject: `菜单广场新分享 - ${menu.title}`,
        html: `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#262626;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0;">
          <div style="background:linear-gradient(90deg,#1677ff,#36cfc9);padding:24px 32px;color:#fff;">
            <h2 style="margin:0;font-size:22px;font-weight:600;">菜单广场新分享</h2>
            <p style="margin:6px 0 0;opacity:.92;font-size:14px;">有人将新菜单分享到了广场，快来看看吧～</p>
          </div>
          <div style="padding:24px 32px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#52c41a;"></span>
              <span style="color:#8c8c8c;font-size:13px;">${timeLabel}</span>
              <span style="margin-left:auto;color:#595959;font-size:13px;">分享者：<strong>${sharer}</strong></span>
            </div>
            ${coverHtml}
            <h3 style="margin:12px 0 8px;font-size:20px;color:#1677ff;">${menu.title}</h3>
            <div style="color:#595959;font-size:14px;line-height:1.6;">${menu.description || ''}</div>
            ${priceHtml}
            <div style="margin-top:16px;">
              <div style="font-weight:600;color:#262626;margin-bottom:6px;">食材：</div>
              <ul style="margin:0;padding-left:18px;color:#595959;font-size:14px;line-height:1.8;">${ingredients || '<li>暂无</li>'}</ul>
            </div>
            <div style="margin-top:16px;">
              <div style="font-weight:600;color:#262626;margin-bottom:6px;">步骤：</div>
              <ol style="margin:0;padding-left:18px;color:#595959;font-size:14px;line-height:1.8;">${steps || '<li>暂无</li>'}</ol>
            </div>
            <div style="margin-top:20px;padding-top:16px;border-top:1px dashed #e8e8e8;color:#8c8c8c;font-size:12px;text-align:center;">
              本邮件由系统自动发送，请勿直接回复
            </div>
          </div>
        </div>
      `,
      });
    } catch (error) {
      this.logger.error('发送广场分享邮件失败', error);
    }
  }
}
