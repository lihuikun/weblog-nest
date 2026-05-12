import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { OrderStatus, TeamInviteStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../category/dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService implements OnModuleInit {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTeamIdForAllUsers();
  }

  async ensureUserTeam(userId: number) {
    const found = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!found) {
      throw new NotFoundException('用户不存在');
    }
    if (!found.teamId) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          teamId: userId,
          teamName: found.teamName ?? `Team-${userId}`,
          isTeamLocked: false,
        },
      });
    }
    return found;
  }

  async getMyTeam(userId: number) {
    const user = await this.ensureUserTeam(userId);
    const teamId = user.teamId!;
    await this.autoCompleteTimeoutOrders(teamId);

    const [categories, teamMembers, orderStatsRaw, menuCount] = await Promise.all([
      this.prisma.category.findMany({
        where: { teamId },
        orderBy: { id: 'desc' },
      }),
      this.prisma.user.findMany({
        where: { teamId },
        select: { id: true, nickname: true, avatarUrl: true, email: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.$queryRaw<
        { orderCount: bigint; completedOrderCount: bigint | null }[]
      >`
        SELECT COUNT(*) AS orderCount,
               COALESCE(SUM(CASE WHEN status = ${OrderStatus.COMPLETED} THEN 1 ELSE 0 END), 0) AS completedOrderCount
        FROM \`order\`
        WHERE teamId = ${teamId}
      `,
      this.prisma.menu.count({ where: { teamId } }),
    ]);

    const toInt = (v: string | bigint | null | undefined) => {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    };
    const row = orderStatsRaw[0];
    const orderCount = toInt(row?.orderCount);
    const completedOrderCount = toInt(row?.completedOrderCount);

    const invitedUsers = teamMembers
      .filter(m => m.id !== userId)
      .map(m => ({
        id: m.id,
        nickname: m.nickname,
        avatarUrl: m.avatarUrl,
        email: m.email,
      }));

    return {
      userId: user.id,
      teamId,
      teamName: user.teamName ?? `Team-${teamId}`,
      isTeamLocked: user.isTeamLocked,
      orderCount,
      completedOrderCount,
      menuCount,
      categories,
      invitedUsers,
    };
  }

  private async autoCompleteTimeoutOrders(teamId: number): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE \`order\`
      SET status = ${OrderStatus.COMPLETED}
      WHERE teamId = ${teamId}
        AND status = ${OrderStatus.MAKING}
        AND createTime <= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
  }

  async getInvitedUsers(userId: number) {
    const user = await this.ensureUserTeam(userId);
    const users = await this.prisma.user.findMany({
      where: { teamId: user.teamId! },
      select: { id: true, nickname: true, avatarUrl: true, email: true },
      orderBy: { id: 'asc' },
    });
    return users
      .filter(item => item.id !== userId)
      .map(item => ({
        id: item.id,
        nickname: item.nickname,
        avatarUrl: item.avatarUrl,
        email: item.email,
      }));
  }

  async getTeamCategories(userId: number) {
    const u = await this.ensureUserTeam(userId);
    return this.prisma.category.findMany({
      where: { teamId: u.teamId! },
      orderBy: { id: 'desc' },
    });
  }

  async getTeamCategoryById(userId: number, categoryId: number) {
    const u = await this.ensureUserTeam(userId);
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, teamId: u.teamId! },
    });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async createTeamCategory(userId: number, dto: CreateCategoryDto) {
    const u = await this.ensureUserTeam(userId);
    return this.prisma.category.create({
      data: {
        teamId: u.teamId!,
        name: dto.name,
        description: dto.description,
        image: dto.image ?? null,
        status: dto.status ?? 'active',
      },
    });
  }

  async updateTeamCategory(userId: number, categoryId: number, dto: UpdateCategoryDto) {
    const u = await this.ensureUserTeam(userId);
    const data: {
      name?: string;
      description?: string;
      image?: string | null;
      status?: string;
    } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.status !== undefined) data.status = dto.status;

    await this.prisma.category.updateMany({
      where: { id: categoryId, teamId: u.teamId! },
      data,
    });
    const updated = await this.prisma.category.findFirst({
      where: { id: categoryId, teamId: u.teamId! },
    });
    if (!updated) throw new NotFoundException('分类不存在');
    return updated;
  }

  async deleteTeamCategory(userId: number, categoryId: number): Promise<{ success: boolean }> {
    const u = await this.ensureUserTeam(userId);
    const r = await this.prisma.category.deleteMany({
      where: { id: categoryId, teamId: u.teamId! },
    });
    if (r.count === 0) throw new NotFoundException('分类不存在');
    return { success: true };
  }

  async getTeamMembers(userId: number) {
    const u = await this.ensureUserTeam(userId);
    return this.prisma.user.findMany({
      where: { teamId: u.teamId! },
      select: { id: true, nickname: true, avatarUrl: true, email: true, teamId: true },
      orderBy: { id: 'asc' },
    });
  }

  async createInvite(userId: number, expireDays: number = 7) {
    const user = await this.ensureUserTeam(userId);
    if (user.isTeamLocked) {
      throw new ForbiddenException('加入他人团队后不能再发起邀请');
    }
    const code = await this.generateUniqueInviteCode();
    const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
    await this.prisma.teamInvite.create({
      data: {
        inviterUserId: user.id,
        targetTeamId: user.teamId!,
        code,
        status: TeamInviteStatus.pending,
        expireAt,
      },
    });
    const baseUrl = process.env.FRONTEND_URL || '';
    const inviteLink = baseUrl ? `${baseUrl.replace(/\/$/, '')}/invite/${code}` : code;
    return { code, expireAt, inviteLink };
  }

  async joinTeamByInviteCode(userId: number, inviteCode?: string): Promise<void> {
    if (!inviteCode) return;

    const user = await this.ensureUserTeam(userId);
    if (user.isTeamLocked) {
      throw new BadRequestException('你已加入团队，不能再次加入');
    }

    const invite = await this.prisma.teamInvite.findFirst({
      where: { code: inviteCode },
    });
    if (!invite) throw new NotFoundException('邀请短链不存在');
    if (invite.status !== TeamInviteStatus.pending) {
      throw new BadRequestException('邀请短链已失效');
    }
    if (invite.expireAt.getTime() <= Date.now()) {
      await this.prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: TeamInviteStatus.expired },
      });
      throw new BadRequestException('邀请短链已过期');
    }
    if (invite.inviterUserId === user.id) {
      throw new BadRequestException('不能加入自己的团队');
    }

    const inviter = await this.prisma.user.findUnique({ where: { id: invite.inviterUserId } });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          teamId: invite.targetTeamId,
          teamName: inviter?.teamName ?? `Team-${invite.targetTeamId}`,
          isTeamLocked: true,
        },
      }),
      this.prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: TeamInviteStatus.accepted },
      }),
    ]);
  }

  async listInvites(userId: number) {
    const u = await this.ensureUserTeam(userId);
    return this.prisma.teamInvite.findMany({
      where: { targetTeamId: u.teamId! },
      orderBy: { id: 'desc' },
    });
  }

  async updateTeamName(userId: number, teamName: string): Promise<{ success: boolean; teamName: string }> {
    const user = await this.ensureUserTeam(userId);
    const normalizedTeamName = teamName.trim();
    if (!normalizedTeamName) {
      throw new BadRequestException('团队名称不能为空');
    }
    await this.prisma.user.updateMany({
      where: { teamId: user.teamId! },
      data: { teamName: normalizedTeamName },
    });
    return { success: true, teamName: normalizedTeamName };
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex');
      const exists = await this.prisma.teamInvite.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new BadRequestException('生成邀请码失败，请稍后重试');
  }

  private async ensureTeamIdForAllUsers(): Promise<void> {
    const users = await this.prisma.user.findMany({
      select: { id: true, teamId: true, teamName: true, isTeamLocked: true },
    });
    for (const user of users) {
      try {
        if (!user.teamId) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              teamId: user.id,
              teamName: user.teamName ?? `Team-${user.id}`,
              isTeamLocked: false,
            },
          });
        } else if (!user.teamName) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { teamName: `Team-${user.teamId}` },
          });
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`补齐teamId失败 userId=${user.id}: ${msg}`);
      }
    }
  }
}
