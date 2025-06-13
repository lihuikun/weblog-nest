# 微信公众号模块

## 功能说明

本模块实现了微信公众号的服务器验证功能，为后续开发微信公众号扫码登录提供基础。

## 环境变量配置

需要在`.env`文件中配置以下环境变量：

```bash
# 微信公众号配置
WECHAT_OFFICIAL_TOKEN=your_token_here
WECHAT_OFFICIAL_ID=your_appid_here
WECHAT_OFFICIAL_SECRET=your_appsecret_here
```

## API接口说明

### 1. 验证微信服务器签名

**请求方式**：GET

**接口路径**：`/wechat/check`

**请求参数**：

| 参数名    | 类型   | 必填 | 描述         |
| --------- | ------ | ---- | ------------ |
| signature | string | 是   | 微信加密签名 |
| timestamp | string | 是   | 时间戳       |
| nonce     | string | 是   | 随机数       |
| echostr   | string | 是   | 随机字符串   |

**响应参数**：
成功时直接返回`echostr`参数值

**错误响应**：

- 400 Bad Request - 缺少必要的参数
- 400 Bad Request - 签名验证失败

## 使用方法

在微信公众平台"设置与开发" -> "基本配置" -> "服务器配置"中：

1. 填写服务器地址(URL)：`https://你的域名/wechat/check`
2. 填写令牌(Token)：与环境变量 `WECHAT_OFFICIAL_TOKEN` 保持一致
3. 点击"提交"按钮，验证服务器配置

## 开发说明

### 目录结构

```
src/wechat/
├── constants/                # 常量定义
│   └── wechat.constant.ts
├── interfaces/              # 接口定义
│   └── wechat.interface.ts
├── wechat.controller.ts     # 控制器
├── wechat.service.ts        # 服务
└── wechat.module.ts         # 模块
```

### 后续开发计划

- [ ] 接收微信公众号消息和事件推送
- [ ] 实现公众号OAuth授权登录
- [ ] 支持消息加解密功能
