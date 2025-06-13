/**
 * 微信相关常量
 */
export const WECHAT_CONSTANTS = {
    /**
     * 微信公众号环境变量名
     */
    ENV: {
        TOKEN: 'WECHAT_OFFICIAL_TOKEN',
        APP_ID: 'WECHAT_OFFICIAL_ID',
        APP_SECRET: 'WECHAT_OFFICIAL_SECRET',
    },

    /**
     * 微信API接口
     */
    API: {
        ACCESS_TOKEN: 'https://api.weixin.qq.com/cgi-bin/token',
        USER_INFO: 'https://api.weixin.qq.com/cgi-bin/user/info',
        OAUTH_ACCESS_TOKEN: 'https://api.weixin.qq.com/sns/oauth2/access_token',
        OAUTH_USER_INFO: 'https://api.weixin.qq.com/sns/userinfo',
    },
}; 