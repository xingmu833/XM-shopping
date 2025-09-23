# vue-mc-shopping

## 项目概述

vue-mc-shopping 是一个基于 Vue 3 + Vite 开发的电商平台前端应用，提供商品浏览、购物车管理、订单处理等核心电商功能。项目采用现代前端技术栈，具有良好的用户体验和响应式设计，同时集成了AI助手功能，为用户提供智能客服和购物建议。

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI组件库**: Element Plus
- **AI助手**: 集成通义千问API
- **样式方案**: SCSS
- **网络请求**: Axios

## 主要功能

- **商品浏览**: 支持分类浏览、搜索、筛选等功能
- **商品详情**: 展示商品信息、规格、评价等
- **购物车**: 商品添加、数量修改、删除、结算等
- **用户系统**: 登录、注册、个人信息管理
- **订单管理**: 订单创建、支付、查看历史订单
- **AI助手**: 智能客服、购物建议、商品推荐

## AI助手使用说明

### 功能介绍

AI助手集成了通义千问大语言模型，为用户提供实时智能交互功能，包括：

- **智能客服**: 解答购物相关问题
- **购物建议**: 根据用户需求提供商品推荐
- **商品咨询**: 帮助用户了解商品信息
- **订单查询**: 协助用户查询订单状态
- **Markdown支持**: AI回复内容支持Markdown格式渲染，包括代码高亮、表格、链接等
- **流式响应**: AI回复实时显示，提供打字机效果的交互体验

### 如何使用

1. **打开AI助手**:
   - 在应用界面点击右下角的AI助手图标
   - 或使用快捷键打开AI助手抽屉

2. **与AI助手交流**:
   - 在输入框中输入您的问题或需求
   - 支持中文和英文输入
   - 点击发送按钮或按Enter键发送消息

3. **查看AI回复**:
   - AI助手会实时流式显示回复内容
   - Markdown格式内容会自动渲染为富文本

4. **模型切换**:
   - 目前默认使用"通义千问plus"模型
   - 可以在设置中切换不同的AI模型

5. **历史记录**:
   - 系统会保存您的聊天历史
   - 可以查看、切换或删除历史对话

### 配置说明

AI助手使用通义千问API，需要配置有效的API密钥。配置信息位于项目环境变量中：

```
# 在.env文件中设置
VITE_OPENAI_API_KEY=您的API密钥
```

## 项目开发

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Compile and Minify for Production

```sh
pnpm build
```
