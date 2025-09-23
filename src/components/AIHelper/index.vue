<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { marked } from 'marked';

// 使用SSE直接调用API，不再需要OpenAI客户端实例
const drawerVisible = ref(false);
const openDrawer = () => {
  drawerVisible.value = !drawerVisible.value;
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
const userMessages = ref("");

// 消息接口定义
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// 聊天历史接口定义
interface ChatHistory {
  id: string;
  label: string;
  createTime: Date;
  messages: Message[];
}

// 当前聊天消息列表
const messageList = ref<Message[]>([
  {
    role: 'assistant',
    content: '您好！我是AI购物助手，有什么可以帮助您的吗？',
    timestamp: new Date()
  }
]);

// 历史记录列表
const historyList = ref<ChatHistory[]>([]);

// 当前聊天ID
const currentChatId = ref<string>('');

// 加载状态
const isLoading = ref(false);

// 格式化时间显示
const formatTime = (date: Date) => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// 解析markdown文本为HTML
const parseMarkdown = (text: string): string => {
  return marked.parse(text) as string;
};

// 格式化日期为聊天标题
const formatChatTitle = (date: Date): string => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `聊天 ${month}月${day}日 ${hours}:${minutes}`;
};

// 保存当前聊天到历史记录
const saveCurrentChatToHistory = () => {
  // 如果当前有用户消息，才保存到历史记录
  const hasUserMessage = messageList.value.some(msg => msg.role === 'user');
  if (!hasUserMessage) return;

  const now = new Date();
  const chatTitle = formatChatTitle(now);
  
  if (currentChatId.value) {
    // 更新现有聊天
    const existingIndex = historyList.value.findIndex(h => h.id === currentChatId.value);
    if (existingIndex !== -1) {
      historyList.value[existingIndex].messages = [...messageList.value];
    }
  } else {
    // 创建新聊天记录
    const newChat: ChatHistory = {
      id: `chat-${Date.now()}`,
      label: chatTitle,
      createTime: now,
      messages: [...messageList.value]
    };
    historyList.value.unshift(newChat);
    currentChatId.value = newChat.id;
  }
  
  // 保存到本地存储
  saveHistoryToLocalStorage();
};

// 从本地存储加载历史记录
const loadHistoryFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('aiChatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 转换时间字符串为Date对象
      historyList.value = parsed.map((chat: any) => ({
        ...chat,
        createTime: new Date(chat.createTime),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

// 保存历史记录到本地存储
const saveHistoryToLocalStorage = () => {
  try {
    localStorage.setItem('aiChatHistory', JSON.stringify(historyList.value));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
};

// 新建聊天
const createNewChat = () => {
  // 先保存当前聊天（如果有内容）
  saveCurrentChatToHistory();
  
  // 重置当前聊天
  messageList.value = [
    {
      role: 'assistant',
      content: '您好！我是AI购物助手，有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ];
  currentChatId.value = '';
};

// 清空聊天记录
const clearChat = () => {
  messageList.value = [
    {
      role: 'assistant',
      content: '您好！我是AI购物助手，有什么可以帮助您的吗？',
      timestamp: new Date()
    }
  ];
  currentChatId.value = '';
};

// 加载历史聊天
const loadHistoryChat = (chatId: string) => {
  const chat = historyList.value.find(h => h.id === chatId);
  if (chat) {
    messageList.value = [...chat.messages];
    currentChatId.value = chatId;
  }
};

// 删除历史记录
const deleteHistoryChat = (chatId: string) => {
  const index = historyList.value.findIndex(h => h.id === chatId);
  if (index !== -1) {
    historyList.value.splice(index, 1);
    saveHistoryToLocalStorage();
    
    // 如果删除的是当前聊天，重置当前聊天
    if (chatId === currentChatId.value) {
      clearChat();
    }
  }
};

// 发送消息（使用SSE流式通信）
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
  
  // 创建AI回复的临时消息
  let aiMessageIndex = messageList.value.length;
  let aiMessage: Message = {
    role: 'assistant',
    content: '',
    timestamp: new Date()
  };
  messageList.value.push(aiMessage);
  
  try {
    // 使用fetch的流式响应
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer `
      },
      body: JSON.stringify({
        model: valueSelect.value,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...messageList.value.filter(msg => msg.role !== 'system' && msg.role !== 'assistant').map(msg => ({ 
            role: msg.role, 
            content: msg.content 
          }))
        ],
        stream: true
      })
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 创建reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    // 读取流数据
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码并处理数据
      const chunk = decoder.decode(value, { stream: true });
      
      // 分割SSE事件
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
              // 更新AI回复内容
              fullContent += jsonData.choices[0].delta.content;
              messageList.value[aiMessageIndex].content = fullContent;
              messageList.value[aiMessageIndex].timestamp = new Date();
            }
          } catch (e) {
            console.error('解析SSE数据失败:', e);
          }
        }
      }
    }
    
    // 保存到历史记录
    saveCurrentChatToHistory();
    
  } catch (error) {
    console.error('API调用错误:', error);
    // 更新错误消息
    messageList.value[aiMessageIndex].content = '抱歉，我现在无法为您提供帮助，请稍后再试。';
    messageList.value[aiMessageIndex].timestamp = new Date();
  } finally {
    // 隐藏加载状态
    isLoading.value = false;
  }
};

// 监听抽屉关闭，保存当前聊天
watch(drawerVisible, (newVal) => {
  if (!newVal) {
    saveCurrentChatToHistory();
  }
});

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistoryFromLocalStorage();
});

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
        <el-aside width="180px">
          <div class="aside-content">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: 16px;">
              <el-button class="clear-chat-btn" type="primary" size="small" @click="createNewChat">新建聊天</el-button>
              <el-button type="warning" class="clear-chat-btn" size="small" @click="clearChat">清空聊天</el-button>
            </div>
            <div class="quick-questions">
              <p class="quick-title">历史记录</p>
              <div 
                v-for="item in historyList"
                :key="item.id"
                class="history-item"
                :class="{ 'active': currentChatId === item.id }"
                @click="loadHistoryChat(item.id)"
              >
                <el-tag class="quick-tag">
                  {{ item.label }}
                  <el-button 
                    type="text" 
                    size="small" 
                    class="delete-btn"
                    @click.stop="deleteHistoryChat(item.id)"
                    title="删除此聊天记录"
                  >
                    ×
                  </el-button>
                </el-tag>
              </div>
              <p v-if="historyList.length === 0" class="no-history">暂无历史记录</p>
            </div>
          </div>
        </el-aside>
        <el-container>
          <el-header>
            <div style="display: flex; align-items: center;">
              <p>当前模型：</p>
              <select v-model="valueSelect" placeholder="请选择模型" style="width: 150px; height: 30px; margin-left: 10px;">
                <option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >{{ item.label }}</option>
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
                  <div 
                    class="message-text" 
                    :class="{ 'markdown-content': message.role === 'assistant' }"
                    v-if="message.role === 'assistant'"
                    v-html="parseMarkdown(message.content)"
                  ></div>
                  <div v-else class="message-text">{{ message.content }}</div>
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