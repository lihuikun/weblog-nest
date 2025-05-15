import { Injectable } from '@nestjs/common';
import { DailyQuote } from './entities/daily-quote.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class DailyQuoteService {
    constructor(
        @InjectRepository(DailyQuote)
        private dailyQuoteRepo: Repository<DailyQuote>,
    ) { }

    // 获取每日名言
    async getDailySentence() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 检查是否存在今日名言
        const existingQuote = await this.dailyQuoteRepo.findOne({
            where: { date: todayStr },
        });

        if (existingQuote) {
            return existingQuote;
        }

        // 如果今日名言不存在，则请求api
        const response = await fetch('https://open.iciba.com/dsapi/');
        const data = await response.json();
        console.log("🚀 ~ DailyQuoteService ~ getDailySentence ~ response:", data)

        // 保存data的tts，img，content
        const newQuote = this.dailyQuoteRepo.create({
            date: todayStr,
            tts: data.tts,
            img: data.fenxiang_img,
            content: data.content,
            note: data.note,
        });
        await this.dailyQuoteRepo.save(newQuote);

        return newQuote;
    }


}
