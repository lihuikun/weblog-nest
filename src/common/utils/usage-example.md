# 数据丰富功能使用示例

## 1. MessageService中的用法

```typescript
// 在MessageService中
private async enrichMessagesWithUserInfo(messages: Message[]) {
    // 提取所有发送者ID
    const senderIds = [...new Set(messages.map(msg => msg.senderId).filter(id => id))];
    
    // 批量获取用户信息
    const usersInfo = await this.userService.getUsersBasicInfo(senderIds);
    
    // 为每条消息添加发送者信息
    return messages.map(msg => ({
        ...msg,
        sender: usersInfo[msg.senderId] || {
            id: msg.senderId,
            nickname: '未知用户',
            avatarUrl: ''
        }
    }));
}
```

## 2. 通用DataEnricher工具的用法

```typescript
// 在Service中注入UserService
constructor(
    private readonly userService: UserService,
) {}

// 使用DataEnricher
const enricher = new DataEnricher(this.userService);

// 为文章添加作者信息
const articlesWithAuthor = await enricher.enrichWithAuthorInfo(articles);

// 为评论添加用户信息
const commentsWithUser = await enricher.enrichWithCommenterInfo(comments);

// 为消息添加发送者信息
const messagesWithSender = await enricher.enrichWithSenderInfo(messages);
```

## 3. API返回数据格式

### 之前的消息数据

```json
{
  "id": 1,
  "senderId": 123,
  "content": "Hello World",
  "type": "notification",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### 现在的消息数据

```json
{
  "id": 1,
  "senderId": 123,
  "content": "Hello World",
  "type": "notification",
  "createdAt": "2023-01-01T00:00:00Z",
  "sender": {
    "id": 123,
    "nickname": "张三",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

## 4. 其他Service中的复用

```typescript
// ArticleService中
async getArticles() {
    const articles = await this.articleRepo.find();
    const enricher = new DataEnricher(this.userService);
    return enricher.enrichWithAuthorInfo(articles);
}

// CommentService中
async getComments() {
    const comments = await this.commentRepo.find();
    const enricher = new DataEnricher(this.userService);
    return enricher.enrichWithCommenterInfo(comments);
}
```

## 5. 性能优化特点

- ✅ **批量查询**：一次查询所有需要的用户信息，避免N+1问题
- ✅ **去重处理**：自动去重用户ID，减少数据库查询
- ✅ **缓存友好**：可以很容易添加Redis缓存
- ✅ **容错处理**：用户不存在时提供默认信息
