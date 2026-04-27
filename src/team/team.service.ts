import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { TeamInvite, TeamInviteStatus } from './entities/team-invite.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class TeamService implements OnModuleInit {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(TeamInvite)
    private readonly teamInviteRepository: Repository<TeamInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * 启动时补齐历史用户 teamId（个人团队）。
   */
  async onModuleInit(): Promise<void> {
    await this.ensureTeamIdForAllUsers();
  }

  /**
   * 确保用户存在 teamId。默认 teamId = user.id（个人团队）。
   */
  async ensureUserTeam(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (!user.teamId) {
      user.teamId = user.id;
      user.teamName = user.teamName || `Team-${user.id}`;
      user.isTeamLocked = false;
      await this.userRepository.save(user);
    }
    return user;
  }

  /**
   * 获取当前用户团队信息。
   */
  async getMyTeam(userId: number) {
    const user = await this.ensureUserTeam(userId);
    return {
      userId: user.id,
      teamId: user.teamId,
      teamName: user.teamName || `Team-${user.teamId}`,
      isTeamLocked: user.isTeamLocked,
    };
  }

  /**
   * 获取当前团队成员。
   */
  async getTeamMembers(userId: number): Promise<User[]> {
    const user = await this.ensureUserTeam(userId);
    return this.userRepository.find({
      where: { teamId: user.teamId },
      select: ['id', 'nickname', 'avatarUrl', 'email', 'teamId'],
      order: { id: 'ASC' },
    });
  }

  /**
   * 创建邀请短链。
   */
  async createInvite(userId: number, expireDays: number = 7): Promise<{ code: string; expireAt: Date; inviteLink: string }> {
    const user = await this.ensureUserTeam(userId);
    if (user.isTeamLocked) {
      throw new ForbiddenException('加入他人团队后不能再发起邀请');
    }

    const code = await this.generateUniqueInviteCode();
    const expireAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);
    const invite = this.teamInviteRepository.create({
      inviterUserId: user.id,
      targetTeamId: user.teamId!,
      code,
      status: TeamInviteStatus.PENDING,
      expireAt,
    });
    await this.teamInviteRepository.save(invite);

    const baseUrl = process.env.FRONTEND_URL || '';
    const inviteLink = baseUrl ? `${baseUrl.replace(/\/$/, '')}/invite/${code}` : code;
    return { code, expireAt, inviteLink };
  }

  /**
   * 登录/注册后自动处理邀请短链，完成加入团队。
   */
  async joinTeamByInviteCode(userId: number, inviteCode?: string): Promise<void> {
    if (!inviteCode) return;

    const user = await this.ensureUserTeam(userId);
    if (user.isTeamLocked) {
      throw new BadRequestException('你已加入团队，不能再次加入');
    }

    const invite = await this.teamInviteRepository.findOne({
      where: { code: inviteCode },
    });
    if (!invite) {
      throw new NotFoundException('邀请短链不存在');
    }
    if (invite.status !== TeamInviteStatus.PENDING) {
      throw new BadRequestException('邀请短链已失效');
    }
    if (invite.expireAt.getTime() <= Date.now()) {
      invite.status = TeamInviteStatus.EXPIRED;
      await this.teamInviteRepository.save(invite);
      throw new BadRequestException('邀请短链已过期');
    }
    if (invite.inviterUserId === user.id) {
      throw new BadRequestException('不能加入自己的团队');
    }

    const inviter = await this.userRepository.findOne({ where: { id: invite.inviterUserId } });

    user.teamId = invite.targetTeamId;
    user.teamName = inviter?.teamName || `Team-${invite.targetTeamId}`;
    user.isTeamLocked = true;
    await this.userRepository.save(user);

    invite.status = TeamInviteStatus.ACCEPTED;
    await this.teamInviteRepository.save(invite);
  }

  /**
   * 查询当前团队邀请列表。
   */
  async listInvites(userId: number): Promise<TeamInvite[]> {
    const user = await this.ensureUserTeam(userId);
    return this.teamInviteRepository.find({
      where: { targetTeamId: user.teamId },
      order: { id: 'DESC' },
    });
  }

  /**
   * 启动时补齐历史用户 teamId。
   */
  private async ensureTeamIdForAllUsers(): Promise<void> {
    const users = await this.userRepository.find({ select: ['id', 'teamId', 'teamName', 'isTeamLocked'] });
    for (const user of users) {
      try {
        if (!user.teamId) {
          user.teamId = user.id;
          user.teamName = user.teamName || `Team-${user.id}`;
          user.isTeamLocked = false;
          await this.userRepository.save(user);
        } else if (!user.teamName) {
          user.teamName = `Team-${user.teamId}`;
          await this.userRepository.save(user);
        }
      } catch (error) {
        this.logger.error(`补齐teamId失败 userId=${user.id}: ${error.message}`);
      }
    }
  }

  /**
   * 修改团队名称（团队成员都可修改）。
   */
  async updateTeamName(userId: number, teamName: string): Promise<{ success: boolean; teamName: string }> {
    const user = await this.ensureUserTeam(userId);
    const normalizedTeamName = teamName.trim();
    if (!normalizedTeamName) {
      throw new BadRequestException('团队名称不能为空');
    }

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ teamName: normalizedTeamName })
      .where('teamId = :teamId', { teamId: user.teamId })
      .execute();

    return {
      success: true,
      teamName: normalizedTeamName,
    };
  }

  /**
   * 生成唯一短邀请码。
   */
  private async generateUniqueInviteCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex');
      const exists = await this.teamInviteRepository.findOne({ where: { code } });
      if (!exists) return code;
    }
    throw new BadRequestException('生成邀请码失败，请稍后重试');
  }
}
