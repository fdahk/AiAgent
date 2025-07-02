import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ChatMessage } from '@/apis/aiService';

// 保存的对话接口
interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

// Context对话接口
interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatKey: number;
  setChatKey: React.Dispatch<React.SetStateAction<number>>;
  clearChat: () => void;
  newChat: () => void;
  saveCurrentChat: () => void;
  getSavedChats: () => SavedChat[];
  loadChat: (chatId: string) => void;
  isHistoryChat: boolean; // 当前是否是历史对话
}

// 创建Context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 自定义Provider组件
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  
  // 当前对话状态
  const [isHistoryChat, setIsHistoryChat] = useState(false);
  // 保存当前对话到本地存储
  const saveCurrentChat = () => {
    if (messages.length === 0) return; // 空对话不保存
    
    const chatId = Date.now().toString();
    const title = generateChatTitle(messages);
    const savedChat: SavedChat = {
      id: chatId,
      title,
      messages: [...messages],
    };
    
    // 获取现有的保存对话
    const savedChats = getSavedChats();
    savedChats.unshift(savedChat); // 添加到开头
    // 最多保存50个
    const limitedChats = savedChats.slice(0, 50);
    // 保存到localStorage
    localStorage.setItem('savedChats', JSON.stringify(limitedChats));
    console.log(`对话已保存: ${title}`);
    // 如果当前是新对话，保存后将其更新历史对话
    if (!isHistoryChat) {
      setIsHistoryChat(true);
    }
  };
  
  // 生成对话标题
  const generateChatTitle = (messages: ChatMessage[]): string => {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      // 取前20个字符作为标题
      const title = firstUserMessage.content.slice(0, 20);
      return title.length < firstUserMessage.content.length ? title + '...' : title;
    }
    return `对话 ${new Date().toLocaleString()}`;
  };
  
  // 获取所有保存的对话
  const getSavedChats = (): SavedChat[] => {
    try {
      const saved = localStorage.getItem('savedChats');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('读取保存的对话失败:', error);
      return [];
    }
  };
  
  // 加载指定的对话
  const loadChat = (chatId: string) => {
    const savedChats = getSavedChats();
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setChatKey(prev => prev + 1);
      // 更新当前是否是历史对话状态
      setIsHistoryChat(true);
    }
  };
  
  // 清空聊天记录
  const clearChat = () => {
    setMessages([]);
    setChatKey(prev => prev + 1); //触发页面更新
    setIsHistoryChat(false);// 重置为新对话
  };

  // 要Context传递的值
  const value = {
    messages,
    setMessages,
    chatKey,
    setChatKey,
    clearChat,
    newChat: clearChat,
    saveCurrentChat,
    getSavedChats,
    loadChat,
    isHistoryChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children} {/* 所有被包裹的children都能访问这个value */}
    </ChatContext.Provider>
  );
}

// 自定义Hook使用Context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('必须在ChatProvider内部使用');
  }
  return context;
}

//使用原生provider
export default ChatContext;