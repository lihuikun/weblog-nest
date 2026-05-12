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

            const rawCt = response.headers['content-type'];
            const contentType =
              typeof rawCt === 'string'
                ? rawCt
                : Array.isArray(rawCt) && typeof rawCt[0] === 'string'
                  ? rawCt[0]
                  : 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.send(response.data);
        } catch (e) {
            res.status(500).send('图片加载失败');
        }
    }
}
