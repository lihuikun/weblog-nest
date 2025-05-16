import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { ApiOperation } from '@nestjs/swagger';

@Controller('juejin')
export class JuejinController {

    @Get('img')
    @ApiOperation({ summary: '掘金代理图片' })
    async proxyImg(@Query('url') url: string, @Res() res: Response) {
        if (!url?.startsWith('http')) {
            return res.status(400).send('Invalid URL');
        }

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    Referer: 'https://juejin.cn/', // ✨ 掘金的防盗链关键就是这个 Referer
                },
            });

            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            res.send(response.data);
        } catch (e) {
            res.status(500).send('图片加载失败');
        }
    }
}
