import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WECHAT_CONSTANTS } from './constants/wechat.constant';

@Injectable()
export class WechatService {
    private readonly logger = new Logger(WechatService.name);
    private token: string;

    constructor(private readonly configService: ConfigService) {
        // 从环境变量获取微信公众号的token
        this.token = this.configService.get<string>(WECHAT_CONSTANTS.ENV.TOKEN);

        if (!this.token) {
            this.logger.warn(`环境变量 ${WECHAT_CONSTANTS.ENV.TOKEN} 未设置，微信验证功能可能无法正常工作`);
        }
    }

    /**
     * 验证微信服务器签名
     * @param signature 微信加密签名
     * @param timestamp 时间戳
     * @param nonce 随机数
     * @returns 验证是否通过
     */
    checkSignature(signature: string, timestamp: string, nonce: string): boolean {
        if (!this.token) {
            this.logger.error(`环境变量 ${WECHAT_CONSTANTS.ENV.TOKEN} 未设置，无法验证签名`);
            return false;
        }

        // 1. 将token、timestamp、nonce三个参数进行字典序排序
        const tmpArr = [this.token, timestamp, nonce].sort();

        // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
        const tmpStr = tmpArr.join('');
        const hashCode = crypto.createHash('sha1').update(tmpStr).digest('hex');

        // 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
        const isValid = hashCode === signature;

        if (!isValid) {
            this.logger.warn('微信签名验证失败');
        }

        return isValid;
    }
}
