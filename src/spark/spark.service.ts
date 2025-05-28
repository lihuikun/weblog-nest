import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { dramPrompts } from '../prompts/dream';
import { CreateSparkDto } from './dto/create-spark.dto';
import { OpenAI } from 'openai';

@Injectable()
export class SparkService {
    private readonly logger = new Logger(SparkService.name)
    private readonly apiKey = process.env.SPARK_KEY
    private openai: OpenAI

    constructor() {
        this.openai = new OpenAI({
            apiKey: this.apiKey,
            baseURL: 'https://spark-api-open.xf-yun.com/v1'
        })
    }

    async getChatCompletion(
        createSparkDto: CreateSparkDto,
        onChunk?: (chunk: string) => void
    ): Promise<any> {
        try {
            const prompt = dramPrompts;

            const stream = await this.openai.chat.completions.create({
                model: 'lite',
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: createSparkDto.userInput },
                ],
                stream: true,
            });

            let fullContent = '';

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;

                    // 如果提供了回调函数，实时推送数据
                    if (onChunk) {
                        onChunk(content);
                    }

                    console.log('📝 调用OpenAI API成功新增内容:', content);
                }
            }

            // 流结束后通知
            if (onChunk) {
                onChunk('[DONE]');
            }

            console.log('🎉 流式输出完成，完整内容:', fullContent);
            return fullContent;

        } catch (error) {
            console.error('❌ Error fetching chat completion:', error);
            throw error;
        }
    }
}
