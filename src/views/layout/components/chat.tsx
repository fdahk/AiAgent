import chatStyles from './chat.module.css'; 
import React, { useState, useEffect } from 'react';
// TypeScript严格模式要求类型导入使用type关键字
// 类型导入与值导入分开，使用 type 关键字明确标识类型导入
// 值导入 - 运行时存在，提供实际的API调用功能
import { aiService } from '@/apis/aiService';
// 类型导入 - 编译时存在，运行时擦除，仅用于TypeScript类型检查
import type { ChatMessage, ModelInfo } from '@/apis/aiService';  

// 定义Layout函数组件 - React函数式组件的标准写法
function Chat() {
  // useState Hook模式：const [state, setState] = useState<Type>(initialValue);
  // state: 当前状态值  setState: 更新状态的函数  <Type>: TypeScript类型注解（可选）  initialValue: 初始值

  const [input, setInput] = useState('');  // 用户输入状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);  // 消息列表状态
  const [loading, setLoading] = useState(false);  // 加载状态
  const [connected, setConnected] = useState(false);  // 连接状态
  const [models, setModels] = useState<ModelInfo[]>([]);  // 可用模型列表状态
  const [selectedModel, setSelectedModel] = useState('llama3.2');// 当前选中的模型
//   const [isStreaming, setIsStreaming] = useState(false);  // 流式回复模式状态,不给选项，默认流式回复
  
  // useEffect Hook - 组件挂载时执行副作用操作
  // 检查连接和加载模型信息
  useEffect(() => {
    // 组件首次渲染时调用连接检查函数
    checkConnection();
  }, []); // 空依赖数组表示只在组件挂载时执行一次

  // 检查Ollama服务连接状态并获取可用模型
  const checkConnection = async () => {
    //aiService检查连接
    const isConnected = await aiService.checkConnection();
    // 更新连接状态
    setConnected(isConnected);
    // 如果连接成功，继续获取模型列表
    if (isConnected) {
      // 获取所有可用的AI模型信息
      const availableModels = await aiService.getAvailableModels();
      // 更新模型列表状态
      setModels(availableModels);
      // 自动选择第一个作为默认模型
      if (availableModels.length > 0) {
        setSelectedModel(availableModels[0].name);
      }
    }
  };

  // 表单提交处理函数
  //React.FormEvent 是 React表单事件的TypeScript类型定义，用于描述表单提交事件的结构
  const handleSubmit = async (e: React.FormEvent) => {
    // 阻止表单默认提交行为（页面刷新）
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    // 构建包含用户消息的新数组，不能直接使用setMessages，其是异步的，不能立即更新
    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    
    // 2. 更新状态显示用户消息
    setMessages(newMessages);
    
    setInput('');
    // 设置加载状态为true，禁用输入和显示加载提示
    setLoading(true);

    //严格模式会故意执行两次某些函数来检测副作用：State更新函数 useEffect回调 事件处理函数
    try {
        // 流式回复
        // 空的AI消息占位符
        const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
        const messagesWithAssistant = [...newMessages, assistantMessage];
        
        // 立即显示AI消息框
        setMessages(messagesWithAssistant);
        
        // ✅ 使用局部变量累积，然后整体赋值
        let accumulatedContent = '';
        
        // 传递完整的对话历史（包含当前用户消息）
        await aiService.chatStream(newMessages, selectedModel, (chunk) => {
            // console.log(chunk);
            accumulatedContent += chunk;        // 在回调内部累积
            setMessages(prevMessages => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                    // lastMessage.content += chunk;
                    lastMessage.content = accumulatedContent; //直接赋值完整内容，而不是累加
                }
                return updatedMessages;
            });
        });
    } catch (error) {
        const errorMessage: ChatMessage = { 
            role: 'assistant', 
            content: `错误: ${error instanceof Error ? error.message : '未知错误'}` 
        };
        setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 清空聊天记录
  const clearChat = () => {
    setMessages([]);
  };

  //未连接到Ollama服务时
  if (!connected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Ai-Agent</h1>
        <div style={{ 
          padding: '20px',                    
          backgroundColor: 'white',         
          border: '1px solid rgba(0, 0, 0, 0.1)',        
          borderRadius: '5px',                
          margin: '20px 0'                    
        }}>
          <h3 style={{ color: 'black' }}>⚠️ 无法连接到Ollama服务</h3>
          <button 
            onClick={checkConnection}        
            style={{ marginTop: '15px', padding: '10px 20px', color: 'black', backgroundColor: 'rgba(32, 60, 99, 0.1)'}}
          >
            重新检测连接
          </button>
        </div>
      </div>
    );
  }

  //聊天界面
  return (
    <div className={chatStyles.chat_container}>



      {/* 对话历史*/}
      <div className={chatStyles.chat_content}>
        {messages.length === 0 ? (
          // 空消息时的占位内容
          <div style={{ textAlign: 'center', color: '#666', marginTop: '150px' }}>
            开始您的AI对话吧！
          </div>
        ) : (
          // 遍历显示所有消息
          messages.map((message, index) => (
            <div key={index} className={message.role === 'user' ? chatStyles.user_message_container : chatStyles.ai_message_container}>
              <div className={message.role === 'user' ? chatStyles.user_message_content : chatStyles.ai_message_content}>
                {message.content}
              </div> 
            </div>
          ))
        )}
        
        {/* 只在loading状态为true时显示 */}
        {loading && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            思考中...
          </div>
        )}
      </div>

      {/* 用户输入区域 */}
      <form onSubmit={handleSubmit} className={chatStyles.chat_input_container}>
        {/* 输入框和发送按钮容器 */}
        <div className={chatStyles.chat_textarea_container}>
          {/* 对话输入*/}
          <textarea
            className={chatStyles.chat_textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入您的问题..."
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

        </div>
        {/* 输入框底部 */}
        <div className={chatStyles.chat_input_footer}>
            {/* 底部左侧按钮区 */}
            <div className={chatStyles.chat_input_footer_left}>
                    {/* 模型选择下拉框 */}
                    <select className={chatStyles.chat_input_footer_left_select} value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} >
                        {/* 选项 */}
                        {models.map((model) => (
                        <option className={chatStyles.chat_input_footer_left_select_option} key={model.name} value={model.name}>
                            {model.name}
                        </option>
                        ))}
                    </select>
            </div>
            {/* 右侧发送按钮 */}
            <button className={chatStyles.chat_input_send} type="submit" disabled={loading || !input.trim()}>
                {loading ? '发送中...' : '发送'}
            </button>
        </div>
      </form>
        {/* 操作提示 */}
        <div style={{ fontSize: '.9rem', color: 'black', margin:'8px 0' }}>按Enter发送，Shift+Enter换行</div>
    </div>
  );
}

export default Chat;