import {
    Controller,
    Get,
    Req,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { WechatService } from './wechat.service';
import { WechatVerifyParams } from './interfaces/wechat.interface';

@ApiTags('微信')
@Controller('wechat')
export class WechatController {
    constructor(private readonly wechatService: WechatService) { }

    @Get('check')
    @ApiOperation({ summary: '验证微信服务器签名' })
    @ApiQuery({ name: 'signature', required: true, description: '微信加密签名' })
    @ApiQuery({ name: 'timestamp', required: true, description: '时间戳' })
    @ApiQuery({ name: 'nonce', required: true, description: '随机数' })
    @ApiQuery({ name: 'echostr', required: true, description: '随机字符串' })
    @ApiResponse({ status: 200, description: '验证成功，返回echostr' })
    async checkWechatLink(@Req() request: Request) {
        const { signature, timestamp, nonce, echostr } = request.query as unknown as WechatVerifyParams;

        if (!signature || !timestamp || !nonce || !echostr) {
            throw new BadRequestException('缺少必要的参数');
        }

        // 验证消息的确来自微信服务器
        const isValid = this.wechatService.checkSignature(signature, timestamp, nonce);

        if (!isValid) {
            throw new BadRequestException('签名验证失败');
        }

        // 原样返回echostr参数
        return echostr;
    }
}
