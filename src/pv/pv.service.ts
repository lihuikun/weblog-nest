import { Injectable, UseInterceptors } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Pv } from './entities/pv.entity';
import { CreatePvDto } from './dto/create-pv.dto';
import { PvInterceptor } from 'src/common/interceptors/pv.interceptor';
@Injectable()
export class PvService {
  constructor(
    @InjectRepository(Pv)
    private PvRepository: Repository<Pv>,
  ) {}
  // @UseInterceptors(PvInterceptor)
  async getPvStats(): Promise<CreatePvDto> {
    const totalPv = (await this.PvRepository.count()) + 200; // 获取总PV
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天的0点

    const todayPv =
      (await this.PvRepository.count({
        where: {
          timestamp: MoreThanOrEqual(today), // 查询当天的PV
        },
      })) + 100;

    return {
      totalPv,
      todayPv,
    };
  }
}
