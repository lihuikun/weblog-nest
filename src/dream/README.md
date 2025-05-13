# 梦境记录模块

## 功能概述

梦境记录模块是一个用于记录和分析用户梦境的功能模块。用户可以记录自己的梦境内容、情绪和标签，并且在后期可以通过AI进行梦境分析。

## 数据结构

梦境记录实体（Dream）包含以下字段：

- `id`: 唯一标识符
- `content`: 梦境内容
- `title`: 梦境标题（可选）
- `emotion`: 梦境情绪（可选）
- `interpretation`: AI分析结果（可选）
- `tags`: 梦境标签（可选）
- `userId`: 用户ID
- `createTime`: 创建时间
- `updatedTime`: 更新时间

## API接口

所有接口都需要用户登录后才能访问，使用JWT认证。

### 创建梦境记录

```
POST /dream
```

请求体：

```json
{
  "content": "梦境内容",
  "title": "梦境标题",
  "emotion": "梦境情绪",
  "tags": "标签1,标签2"
}
```

### 获取所有梦境记录

```
GET /dream
```

### 获取单个梦境记录

```
GET /dream/:id
```

### 更新梦境记录

```
PATCH /dream/:id
```

请求体：

```json
{
  "content": "更新的梦境内容",
  "title": "更新的梦境标题",
  "emotion": "更新的梦境情绪",
  "tags": "更新的标签"
}
```

### 删除梦境记录

```
DELETE /dream/:id
```

### AI分析梦境

```
POST /dream/:id/analyze
```

请求体（可选）：

```json
{
  "prompt": "分析提示词",
  "preference": "分析偏好"
}
```

## 后期AI集成

该模块预留了AI分析接口，后期将接入AI服务进行梦境分析。目前，分析功能返回一个占位符文本。

## 使用示例

```typescript
// 创建梦境记录
const dream = await dreamService.create({
  content: '我梦见自己在飞翔',
  title: '飞翔梦',
  emotion: '兴奋',
  tags: '飞翔,自由'
}, userId);

// 分析梦境
const analysis = await dreamService.analyzeWithAI(dreamId, userId);
```
