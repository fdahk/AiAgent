
import React, { useEffect, useRef } from 'react';

// 声明全局CozeWebSDK类型
declare global {
  interface Window {
    CozeWebSDK: {
      WebChatClient: new (config: any) => any;
    };
  }
}

export const CozeAgent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  console.log(import.meta.env.VITE_COZE_SECRET_TOKEN);
//   console.log(process.env.VITE_COZE_SECRET_TOKEN);
  useEffect(() => {
    // 加载Coze SDK
    const loadCozeSDK = () => {
      const script = document.createElement('script');
      script.src = 'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js';
      script.onload = () => {
        console.log('Coze SDK 加载完成');
        // SDK加载完成后初始化
        if (window.CozeWebSDK) {
          try {
            new window.CozeWebSDK.WebChatClient({
              config: {
                bot_id: '7553978463314247690',
              },
              componentProps: {
                title: 'Coze AI Assistant',
              },
              auth: {
                type: 'token',
                token: import.meta.env.VITE_COZE_SECRET_TOKEN,
                onRefreshToken: function () {
                  return import.meta.env.VITE_COZE_SECRET_TOKEN;
                }
              }
            });
          } catch (error) {
            console.error('Coze WebChatClient 初始化失败:', error);
          }
        } else {
          console.error('CozeWebSDK 未找到');
        }
      };
      
      script.onerror = (error) => {
        console.error('Coze SDK 加载失败:', error);
      };
      document.head.appendChild(script);
    };

    // 检查SDK是否已加载
    if (!window.CozeWebSDK) {
      loadCozeSDK();
    } else {
      // 如果已加载，直接初始化
      try {
        new window.CozeWebSDK.WebChatClient({
          config: {
            bot_id: '7553978463314247690',
          },
          componentProps: {
            title: 'Coze AI Assistant',
          },
          auth: {
            type: 'token',
            token: import.meta.env.VITE_COZE_SECRET_TOKEN || 'pat_S6rVinYi8IzaKMaJnPEUAEhCHEh9wEqOnjvOHAops5KQVu0IQDltKO3HNc1NRjBX',
            onRefreshToken: function () {
              return import.meta.env.VITE_COZE_SECRET_TOKEN || 'pat_S6rVinYi8IzaKMaJnPEUAEhCHEh9wEqOnjvOHAops5KQVu0IQDltKO3HNc1NRjBX';
            }
          }
        });
      } catch (error) {
        console.error('Coze WebChatClient 初始化失败（复用SDK）:', error);
      }
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px' }}>
      {/* Coze聊天组件会自动注入到这里 */}
    </div>
  );
};