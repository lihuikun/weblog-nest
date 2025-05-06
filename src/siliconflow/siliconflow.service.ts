import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { dramPrompts } from '../prompts/dream';
import { CreateSiliconflowDto } from './dto/create-siliconflow.dto';
@Injectable()
export class SiliconFlowService {

  async getChatCompletion(createSiliconflowDto: CreateSiliconflowDto): Promise<any> {
    try {
      const prompt = dramPrompts;
      console.log("🚀 ~ SiliconFlowService ~ getChatCompletion ~ prompt:", prompt)

      const response = await axios.post(
        'https://api.siliconflow.cn/v1/chat/completions',
        {
          model: 'Qwen/Qwen2.5-VL-72B-Instruct', // 替换为实际的模型名称
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: createSiliconflowDto.userInput },
          ],
          // "stream": true,
        },
        {
          headers: {
            Authorization: `Bearer sk-kkrtusiamimenvddscptozwxxgpqwuqxmnmoaxaavxnkdyje`, // 替换为你的 API 密钥
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error fetching chat completion:', error);
      throw error;
    }
  }
}
