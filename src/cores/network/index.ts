import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

/** 这个网络请求器还可以有深入研究的地方 ：
 * 手写中间件
 * 
 * */ 

/** 请求配置（可覆盖 baseURL） */
export interface RequestConfig extends Omit<AxiosRequestConfig, 'baseURL'> {
  baseURL?: string;
}

/** 网络客户端：统一错误处理与拦截
 * HTTP 1.1 标准：一共 9 种请求方式
 */
export interface NetworkClient {
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  /**
   * 创建资源
   */
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  /**
   * 部分更新
   */
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  /**
   * 预检请求
   */
  options: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  /** 流式请求（fetch），用于 SSE/流式响应
   * @param url 
   * @param options 请求配置：method、headers、body、signal等
   */
  fetchStream: (url: string, options?: RequestInit) => Promise<Response>;
}

// 这里导出工厂函数，项目可能存在多个网络请求器，每个请求器有不同的 baseURL
export function createClient(defaultBaseURL: string): NetworkClient {
  const instance: AxiosInstance = axios.create({
    baseURL: defaultBaseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json', 
    },
  });

  // axios内置的响应拦截器
  instance.interceptors.response.use(
    // 成功回调
    (res) => res, // 直接返回响应对象
    // 失败回调
    (err) => {
      if (axios.isAxiosError(err) && err.code === 'ECONNREFUSED') {
        return Promise.reject(new Error('无法连接到服务，请检查服务是否已启动'));
      }
      return Promise.reject(err);
    }
  );

  // axios请求拦截器
  /**
   * 请求拦截器：在请求发送之前进行拦截，可以进行一些预处理，如添加请求头、添加请求参数等
   */
  instance.interceptors.request.use(
    (config) => {
      // 添加请求头
      config.headers['Content-Type'] = 'application/json';
      // 添加请求参数
      config.params = config.params || {};
      config.params.timestamp = Date.now();
      config.params.nonce = Math.random().toString(36).substring(2, 15); // 用于防止重复请求
      return config;
    },
    (error) => Promise.reject(error)
  );

  return {
    get: <T>(url: string, config?: RequestConfig) =>
      instance.get<T>(url, config).then((res) => res.data as T),

    post: <T>(url: string, data?: unknown, config?: RequestConfig) =>
      instance.post<T>(url, data, config).then((res) => res.data as T),

    put: <T>(url: string, data?: unknown, config?: RequestConfig) =>
      instance.put<T>(url, data, config).then((res) => res.data as T),

    delete: <T>(url: string, config?: RequestConfig) =>
      instance.delete<T>(url, config).then((res) => res.data as T),

    patch: <T>(url: string, data?: unknown, config?: RequestConfig) =>
      instance.patch<T>(url, data, config).then((res) => res.data as T),

    options: <T>(url: string, config?: RequestConfig) =>
      instance.options<T>(url, config).then((res) => res.data as T),

    fetchStream: (url: string, options?: RequestInit) => {
      const fullUrl = url.startsWith('http') ? url : `${defaultBaseURL}${url}`;
      return fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
    },

  };
}

