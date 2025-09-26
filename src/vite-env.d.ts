// 作用：告诉TypeScript编译器Vite的客户端环境变量
// TypeScript 三斜杠指令，它的作用是引入 Vite 客户端的内置类型定义
/// <reference types="vite/client" />

// 这些不是普通的接口定义，而是环境声明，它们告诉 TypeScript："这些类型在全局环境中存在
// 普通接口（需要引入） 环境声明（自动可用
// TypeScript 的类型查找机制  .d.ts 文件的特殊性
// TypeScript 配置： "include": ["src"] - TypeScript 会自动包含 src 目录下的所有 .d.ts 文件
interface ImportMetaEnv {
  readonly VITE_COZE_SECRET_TOKEN: string
}


interface ImportMeta {
  readonly env: ImportMetaEnv
}
