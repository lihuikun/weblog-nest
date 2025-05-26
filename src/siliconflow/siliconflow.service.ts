import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { dramPrompts } from '../prompts/dream';
import { CreateSiliconflowDto } from './dto/create-siliconflow.dto';

@Injectable()
export class SiliconFlowService {
  private readonly logger = new Logger(SiliconFlowService.name)
  async getChatCompletion(
    createSiliconflowDto: CreateSiliconflowDto,
    onChunk?: (chunk: string) => void
  ): Promise<any> {
    try {
      const prompt = dramPrompts;
      console.log("🚀 ~ SiliconFlowService ~ getChatCompletion ~ prompt:", createSiliconflowDto.userInput)
      const response = await axios.post(
        'https://api.siliconflow.cn/v1/chat/completions',
        {
          model: 'Qwen/QwQ-32B',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: createSiliconflowDto.userInput },
          ],
          "stream": true,
        },
        {
          headers: {
            Authorization: `Bearer sk-kkrtusiamimenvddscptozwxxgpqwuqxmnmoaxaavxnkdyje`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );
      this.logger.log(`调用硅基流动api成功: ${response}`);

      return new Promise((resolve, reject) => {
        let fullContent = '';

        response.data.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          console.log('收到chunk:', chunkStr);

          // 处理SSE格式的数据
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6); // 移除 "data: " 前缀

              // 检查是否是结束标记
              if (dataStr.trim() === '[DONE]') {
                console.log('🎉 流式输出完成，完整内容:', fullContent);
                if (onChunk) {
                  onChunk('[DONE]'); // 通知流结束
                }
                resolve(fullContent);
                return;
              }

              try {
                console.log("🚀 ~ SiliconFlowService ~ response.data.on ~ data:", typeof dataStr)
                // 跳过空行或无效的数据行
                if (dataStr.trim() === '' || dataStr === 'data: ') {
                  const data = JSON.parse(dataStr);

                  // 提取内容增量
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    const content = data.choices[0].delta.content;
                    fullContent += content;
                    console.log('📝 新增内容:', content);
                    // this.logger.log(`新增内容: ${content}`);

                    // 如果提供了回调函数，实时推送数据
                    if (onChunk) {
                      onChunk(content);
                    }
                  }
                }
              } catch (parseError) {
                // 忽略无法解析的数据块，继续处理下一个
                // console.log('⚠️ 跳过无法解析的数据块:', dataStr, parseError);
              }
            }
          }
        });

        response.data.on('end', () => {
          console.log('✅ 数据流结束，最终内容:', fullContent);
          if (onChunk) {
            onChunk('[DONE]'); // 通知流结束
          }
          resolve(fullContent);
        });

        response.data.on('error', (error: any) => {
          console.error('❌ 流数据错误:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error fetching chat completion:', error);
      throw error;
    }
  }
}
