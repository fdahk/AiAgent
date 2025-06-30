import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface ModelInfo {
  name: string;
  size: string;
  digest: string;
  modified_at: string;
}

class AIService {
  private baseURL = 'http://localhost:11434';

  // 检查Ollama服务是否可用
  async checkConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/api/tags`);
      return true;
    } catch (error) {
      console.warn('无法连接到Ollama服务，请确保Ollama已启动');
      return false;
    }
  }

  // 获取可用的模型列表
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  // 对话聊天
  async chat(messages: ChatMessage[], model: string = 'llama3.2'): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/api/chat`, {
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
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

  // 简单文本生成
  async generateText(prompt: string, model: string = 'llama3.2'): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500,
        }
      });
      
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

  // 流式对话（实时回复）
  async chatStream(
    messages: ChatMessage[], 
    model: string = 'llama3.2',
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              onChunk(data.message.content);
            }
          } catch (e) {
            // 忽略JSON解析错误
          }
        }
      }
    } catch (error) {
      console.error('流式对话失败:', error);
      throw new Error('流式对话服务暂时不可用');
    }
  }
}

export const aiService = new AIService();