import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';  // 消息角色：用户、助手、系统
  content: string;                        // 消息内容
}

export interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}
/* 模型信息 */
export interface ModelInfo {
  name: string;         // 模型名称，如 'llama3.2', 'qwen2.5'
  size: string;         // 模型大小，如 '2.0GB'
  digest: string;       // 模型哈希值，用于验证完整性
  modified_at: string;  // 模型最后修改时间
}

class ChatBotService {
  private baseURL = 'http://localhost:11434'; //Ollama服务地址
  // 检查Ollama服务是否可用
  async checkConnection(): Promise<boolean> {
    try {
      // 调用 /api/tags 接口检查服务是否响应
      // 这是一个轻量级的检查接口，不消耗太多资源
      await axios.get(`${this.baseURL}/api/tags`);
      return true;
    } catch (error) {
      console.warn('无法连接到Ollama服务', error);
      return false;
    }
  }

  // 获取可用的模型列表
  // 方法立即返回一个 Promise，Promise 内部包含的是"将来会得到的 ModelInfo[]
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  /**
   * 对话聊天 - 非流式响应
   * 
   * @param messages - 对话历史消息数组
   * @param model - 使用的模型名称，默认 'llama3.2'
   * @returns Promise<string> - AI 生成的完整回复
   * 
   * 使用场景：
   * - 需要完整回复后再处理的场景
   * - 简单的一问一答交互
   * - 批量处理对话
   */
  async chat(messages: ChatMessage[], model: string = 'llama3.2'): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,       // 控制回复的随机性 (0.0-2.0)
                                  // 0.7: 平衡创造性和一致性
          top_p: 0.9,            // 核采样参数 (0.0-1.0)
                                  // 0.9: 保留90%概率质量的词汇
        }
      });
      
      return response.data.message.content;
    } catch (error) {
      console.error('AI对话失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('无法连接到Ollama服务，请确保Ollama已启动并运行在 http://localhost:11434');
        }
        if (error.response?.status === 404) {
          throw new Error(`模型 "${model}" 未找到，请先使用 "ollama pull ${model}" 下载模型`);
        }
      }
      throw new Error('AI服务暂时不可用，请稍后再试');
    }
  }

  /**
   * 简单文本生成 - 单次提示生成
   * 
   * @param prompt - 输入提示词
   * @param model - 使用的模型名称，默认 'llama3.2'
   * @returns Promise<string> - 生成的文本内容
   * 
   * 与 chat 接口的区别：
   * - generate: 单次提示生成，无对话历史
   * - chat: 支持多轮对话，维护对话上下文
   * 
   * 使用场景：
   * - 文本补全、续写
   * - 创意写作、诗歌生成
   * - 代码生成、翻译等单次任务
   * - 不需要对话上下文的场景
   */
  async generateText(prompt: string, model: string = 'llama3.2'): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,       // 控制输出的随机性
          top_p: 0.9,            // 核采样参数
          max_tokens: 500,        // 最大生成token数量
                                  // 注意：不是所有模型都支持此参数
        }
      });
      
      // Ollama generate 接口返回的字段是 'response'
      return response.data.response;
    } catch (error) {
      console.error('文本生成失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('无法连接到Ollama服务，请确保Ollama已启动并运行在 http://localhost:11434');
        }
        if (error.response?.status === 404) {
          throw new Error(`模型 "${model}" 未找到，请先使用 "ollama pull ${model}" 下载模型`);
        }
      }
      throw new Error('文本生成服务暂时不可用');
    }
  }

  /**
   * 流式对话 - 实时回复
   * 
   * @param messages - 对话历史消息数组
   * @param model - 使用的模型名称，默认 'llama3.2'
   * @param onChunk - 回调函数，每收到数据块就调用
   * @returns Promise<void> - 流式响应完成
   * 
   * API 端点: POST /api/chat (stream: true)
   * 
   * - 使用 fetch 而非 axios（更好的流式支持）
   * - 逐块读取响应数据
   * - 解析 JSON 流数据
   */
  async chatStream(
    messages: ChatMessage[], 
    model: string = 'llama3.2',
    onChunk: (chunk: string) => void  // 每个数据块的回调函数
  ): Promise<void> {
    try {
      // axios 对流式响应支持较弱，使用 fetch原生支持流式响应
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true, //启用流式响应
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取响应流的读取器
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      // 用于累积完整响应（可选，用于调试或日志）
      // let fullResponse = '';  // 暂时注释，避免 unused variable 警告
      
      // 文本解码器：将字节数据转换为字符串
      // 网络传输的数据格式：
      // 原始数据: Uint8Array [123, 34, 109, 101, 115, 115, ...]  (JSON字节)
      // 解码后: '{"message":{"content":"你"}}\n{"message"...'    (可读字符串)
      const decoder = new TextDecoder('utf-8'); // textDecoder 是 JavaScript 内置的类，用于将字节数据转换为字符串
      
      // 流式数据读取循环
      while (true) {
        // 读取下一个数据块
        const { done, value } = await reader.read();
        
        // 流结束检查
        if (done) break;

        // 将字节数据解码为字符串
        const chunk = decoder.decode(value);
        
        // 处理数据块：
        // Ollama 流式响应格式：每行一个 JSON 对象
        // 示例：{"message":{"content":"你"}}\n{"message":{"content":"好"}}\n
        const lines = chunk.split('\n').filter(line => line.trim());

        // 解析每一行的 JSON 数据
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            // 检查是否包含消息内容
            if (data.message?.content) {
              // 累积完整响应（如果需要的话）
              // fullResponse += data.message.content;
              
              // 调用回调函数，实时显示内容
              onChunk(data.message.content);
            }
          } catch {
            // 忽略 JSON 解析错误
            // 可能原因：数据块不完整、格式错误等
            console.debug('JSON解析失败，跳过此行:', line);
          }
        }
      }
    } catch (error) {
      console.error('流式对话失败:', error);
      throw new Error('流式对话服务暂时不可用');
    }
  }
}

export default new ChatBotService();