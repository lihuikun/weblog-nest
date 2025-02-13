### 前言
由于ai帮忙生成nest项目，前期没有考虑代码的规范，每次都是问ai都要花费大量时间，给ai列了一个需求列表，作为nest的代码规范，也创建了nest的脚手架，方便后续使用，快速初始化nest项目。

### 接口编写的代码规范：

统一使用命令生成，按照这个命令来规范项目目录，保证代码文件的一致。

```
nest g resource [文件夹名称]
```

例如：

```
nest g resource user
```

会生成以下文件：

```
user
├── dto
│   ├── create-user.dto.ts // 创建用户
│   └── update-user.dto.ts // 更新用户（一般继承创建用户的DTO）
|── entities
│   └── user.entity.ts // 用户实体
├── user.controller.spec.ts
├── user.controller.ts // 用户控制器
├── user.module.ts // 用户模块
├── user.service.spec.ts
└── user.service.ts // 用户服务
```

### swagger配置以及使用方式：
（cursor之前生成jsDoc的写法，个人觉得代码量比较多，看起来比较乱，所以统一使用装饰器写法）
```
@Get()
  @ApiOperation({ summary: '获取文章列表' })
  async getArticles(
    @Query('pageIndex') pageIndex: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.articleService.getArticles(pageIndex, pageSize);
  }
```

### git的代码规范：
Husky 是一个非常流行的工具，允许你在 Git 钩子（如 pre-commit 和 pre-push）中执行自定义命令，可以用来运行代码质量检查工具。

安装 Husky：

```
npm install husky --save-dev
```
启用 Git 钩子：
```
npx husky install
```
配置 pre-commit 钩子： 你可以设置 pre-commit 钩子来执行代码格式化或检查，例如：
```
npx husky add .husky/pre-commit "npm run lint"
```
这会在每次提交之前运行 npm run lint 命令。