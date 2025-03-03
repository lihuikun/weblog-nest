import { Injectable, Logger } from '@nestjs/common';
import { CreateHotSearchDto } from './dto/create-hot-search.dto';
import { UpdateHotSearchDto } from './dto/update-hot-search.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { HotSearch } from './entities/hot-search.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class HotSearchService {
  private readonly logger = new Logger(HotSearchService.name);

  constructor(
    @InjectRepository(HotSearch)
    private hotSearchRepository: Repository<HotSearch>,
  ) {}

  /**
   * 爬取抖音热搜榜
   */
  async fetchDouyinHotSearch() {
    try {
      const url =
        'https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/';
      const response = await axios.get(url);

      if (response.data && response.data.word_list) {
        const jsonData = JSON.stringify(response.data); // 把整个 JSON 直接存数据库
        this.saveOrUpdateHotSearch(jsonData, 'douyin');
        this.logger.log(`✅ 抖音热搜数据已更新`);
      }
    } catch (error) {
      this.logger.error('抖音热搜爬取失败:', error);
    }
  }
  /**
   * 爬取掘金热搜榜
   */
  async fetchJuejinHotSearch() {
    try {
      const url =
        'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0';
      const {
        data: { data: response },
      } = await axios.get(url);
      console.log(
        '🚀 ~ HotSearchService ~ fetchJuejinHotSearch ~ response:',
        response,
      );

      const hotSearchList = response.map((item: any, index: number) => ({
        word: item.content.title, // 文章标题
        hot_value: item.content_counter.hot_rank || 0, // 浏览量作为热度
        label: index + 1, // 排名
        url: `https://juejin.cn/post/${item.content.content_id}`, // 文章链接
      }));

      console.log(
        '🚀 ~ HotSearchService ~ hotSearchList ~ hotSearchList:',
        hotSearchList,
      );
      // 查找是否已有掘金热搜数据
      await this.saveOrUpdateHotSearch(JSON.stringify(hotSearchList), 'juejin');

      this.logger.log(`✅ 掘金热搜数据已更新`);
    } catch (error) {
      this.logger.error('掘金热搜爬取失败:', error);
    }
  }
  /**
   * 爬取头条热搜榜
   */
  async fetchToutiaoHotSearch(): Promise<void> {
    this.logger.log('头条热搜爬虫任务开始');
    try {
      // 请求头条热搜数据
      const response = await axios.get(
        'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
      );
      const data = response.data.data; // 假设返回的数据格式为 { data: [...] }

      // 转换数据结构
      const hotSearchList = data.map((item: any, index: number) => {
        return {
          word: item.Title,
          hot_value: parseInt(item.HotValue, 10), // 假设热搜热度是一个数字，转换为整数
          label: index + 1,
        };
      });

      if (hotSearchList.length === 0) {
        return;
      }
      this.saveOrUpdateHotSearch(JSON.stringify(hotSearchList), 'toutiao');
      this.logger.log('头条热搜爬虫任务结束');
    } catch (error) {
      this.logger.error('获取头条热搜数据异常', error);
    }
  }
  /**
   * 爬取微博热搜
   */
  async fetchWeiboHotSearch(): Promise<void> {
    this.logger.log('微博热搜爬虫任务开始');

    try {
      // 1. 获取微博热搜数据
      const response = await axios.get('https://weibo.com/ajax/side/hotSearch');
      const data = response.data?.data?.realtime || [];

      if (!data.length) {
        this.logger.warn('微博热搜数据为空');
        return;
      }

      // 2. 处理数据并转换格式
      const hotSearchList = data.map((item: any, index: number) => ({
        word: item.word, // 标题
        hot_value: parseInt(item.num, 10) || 0, // 热度值
        label: index + 1, // 排名
        url: `https://s.weibo.com/weibo?q=%23${encodeURIComponent(item.word)}%23`, // 文章链接// 生成唯一 ID
      }));

      // 4. 数据持久化
      await this.saveOrUpdateHotSearch(JSON.stringify(hotSearchList), 'weibo');

      this.logger.log('微博热搜爬虫任务结束');
    } catch (error) {
      this.logger.error('获取微博热搜数据异常', error);
    }
  }
  /**
   * 每小时执行一次爬取任务
   */
  @Cron('0 * * * *') // 每小时执行一次
  async fetchAllHotSearch() {
    this.logger.log('开始执行热搜爬取任务...');

    // 爬取抖音热搜
    // await this.fetchDouyinHotSearch();
    await this.fetchJuejinHotSearch();
    // await this.fetchToutiaoHotSearch();
    // await this.fetchWeiboHotSearch();

    // 未来可以增加掘金、百度等的爬取逻辑
  }
  /**
   * 获取某个平台的热搜数据
   */
  async getHotSearch(source: string): Promise<any> {
    const hotSearch = await this.hotSearchRepository.findOne({
      where: { source },
      order: { created_at: 'DESC' }, // 取最新的一条记录
    });

    if (!hotSearch) {
      return { message: '暂无数据' };
    }

    return JSON.parse(hotSearch.data); // 解析 JSON 并返回
  }

  /**
   * 更新数据库
   */
  async saveOrUpdateHotSearch(hotSearchList, source: string) {
    console.log(
      '🚀 ~ HotSearchService ~ saveOrUpdateHotSearch ~ hotSearchList:',
      hotSearchList,
    );
    const existingRecord = await this.hotSearchRepository.findOne({
      where: { source },
    });
    if (existingRecord) {
      // 如果存在，更新数据
      existingRecord.data = hotSearchList;
      existingRecord.created_at = new Date();
      await this.hotSearchRepository.save(existingRecord);
    } else {
      // 如果不存在，插入数据
      await this.hotSearchRepository.insert({
        source: source,
        data: hotSearchList,
        created_at: new Date(),
      });
    }
  }
}
