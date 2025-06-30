import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
//TypeScript类型定义文件， 告诉TypeScript编译器Node.js API的类型信息
import { resolve } from 'path' //# 这是TypeScript需要的npm install -D @types/node，js好像node就可以了


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 运行时（打包和开发服务器），路径别名， 告诉Vite如何解析路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
