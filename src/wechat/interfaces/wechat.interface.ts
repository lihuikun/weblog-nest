/**
 * 微信验证接口参数
 */
export interface WechatVerifyParams {
    signature: string;
    timestamp: string;
    nonce: string;
    echostr: string;
}

/**
 * 微信消息类型
 */
export enum WechatMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VOICE = 'voice',
    VIDEO = 'video',
    MUSIC = 'music',
    NEWS = 'news',
    LOCATION = 'location',
    LINK = 'link',
    EVENT = 'event',
}

/**
 * 微信事件类型
 */
export enum WechatEventType {
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    SCAN = 'SCAN',
    LOCATION = 'LOCATION',
    CLICK = 'CLICK',
    VIEW = 'VIEW',
} 