<script setup lang="ts">
import { ref } from 'vue'


const drawerVisible = ref(false);
const openDrawer = () => {
  drawerVisible.value =  !drawerVisible.value;
  console.log('openDrawer', drawerVisible.value);
}

const valueSelect = ref('通义千问plus');
const options = [
  {
    value: 'qwen-plus',
    label: '通义千问plus'
  },
  {
    value: "deepseek-v3.1",
    label: 'deepseek'
  },
  {
    value: "Moonshot-Kimi-K2-Instruct",
    label: 'KiMi'
  },
  {
    value: "glm-4.5",
    label: 'GLM-4.5'
  }
];

import OpenAI from "openai";

const openai = new OpenAI(
  {
    // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
    apiKey: "",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    dangerouslyAllowBrowser: true, // ⚠️ 明知风险仍启用
  }
);
const userMessages = ref("");

const fetchStreamData = async (userInput: string) => {
  if (!userInput.trim()) return;
  
  // 添加用户消息到消息列表
  const userMessage: Message = {
    role: 'user',
    content: userInput,
    timestamp: new Date()
  };
  messageList.value.push(userMessage);
  // 清空输入框
  userMessages.value = '';
  // 显示加载状态
  isLoading.value = true;
  
  try {
    const completion = await openai.chat.completions.create({
      model: `${valueSelect.value}`,  //此处以qwen-plus为例，可按需更换模型名称
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messageList.value.filter(msg => msg.role !== 'system').map(msg => ({ role: msg.role, content: msg.content }))
      ],
    });
    // 添加AI回复到消息列表
    if (completion.choices && completion.choices[0]?.message?.content) {
      const aiMessage: Message = {
        role: 'assistant',
        content: completion.choices[0].message.content,
        timestamp: new Date()
      };
      messageList.value.push(aiMessage);
    }
    console.log(completion);
  } catch (error) {
    console.error('API调用错误:', error);
    // 添加错误消息
    const errorMessage: Message = {
      role: 'assistant',
      content: '抱歉，我现在无法为您提供帮助，请稍后再试。',
      timestamp: new Date()
    };
    messageList.value.push(errorMessage);
  } finally {
    // 隐藏加载状态
    isLoading.value = false;
  }
};

// 添加消息列表存储对话历史
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const messageList = ref<Message[]>([
  {
    role: 'assistant',
    content: '您好！我是AI购物助手，有什么可以帮助您的吗？',
    timestamp: new Date()
  }
]);
const isLoading = ref(false);

// 清空聊天记录
const clearChat = () => {
  messageList.value = [
    {
      role: 'assistant',
      content: '您好！我是AI购物助手，有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ];
};

// 历史记录列表
const historyList = ref([]);

const formatTime = (date: Date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

</script>

<template>
  <!-- AI助手图标 -->
  <div class="ai-assistant-icon" @click="openDrawer">
    <div class="ai-icon-circle">
      <span class="ai-text">AI</span>
    </div>
  </div>

  <!-- AI聊天抽屉 -->
  <el-drawer
    v-model="drawerVisible"
    title="AI购物助手"
    direction="rtl"
    size="50%"
    z-index="10000"
  >
    <div class="common-layout">
      <el-container>
        <el-aside width="150px">
          <div class="aside-content">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
              <el-button class="clear-chat-btn" type="primary">新建聊天</el-button>
              <el-button type="warning" class="clear-chat-btn" @click="clearChat">清空聊天</el-button>
            </div>
            <div class="quick-questions">
              <p class="quick-title">历史记录</p>
              <el-tag 
                v-for="item in historyList"
                :key="item.value"
                class="quick-tag"
              >
                {{ item.label }}
              </el-tag>
            </div>
          </div>
        </el-aside>
        <el-container>
          <el-header>
            <div style="display: flex; align-items: center;">
              <p>当前模型：</p>
              <select v-model="valueSelect" placeholder="请选择模型" style="width: 100px;height: 30px;">
                <option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </select>
            </div>
          </el-header>
          <el-main style="height: 500px;overflow-y: auto; padding: 16px;" >
            <div class="chat-messages">
              <div 
                v-for="(message, index) in messageList" 
                :key="index"
                :class="['message-item', message.role]"
              >
                <div class="message-avatar">
                  {{ message.role === 'user' ? 'U' : 'AI' }}
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
              <div v-if="isLoading" class="loading-indicator">
                <el-icon><Loading /></el-icon>
                <span>AI正在思考...</span>
              </div>
            </div>
          </el-main>
          <el-footer>
            <div style="display: flex; align-items: center;justify-content: space-evenly;">
              <el-input v-model="userMessages"
              style="width: 80%; height: 100%;"
              maxlength="1000"
              placeholder="请输入您的问题..."
              show-word-limit
              type="textarea"
              @keydown.enter.ctrl="fetchStreamData(userMessages)"
              @keydown.enter.exact="fetchStreamData(userMessages)"
              ></el-input>
              <el-button 
                @click="fetchStreamData(userMessages)" 
                type="primary" 
                :loading="isLoading"
                :disabled="!userMessages.trim() || isLoading"
                >发送</el-button>
            </div>
          </el-footer>
        </el-container>
      </el-container>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
// 导入项目变量
@import '@/styles/var.scss';

@import '@/styles/ai.scss';
</style>