import { StrictMode } from 'react' //React的严格模式，用于检测代码中的潜在问题
import { createRoot } from 'react-dom/client' //React 18的新API，创建根节点，替代旧版本的 ReactDOM.render() 方法
import './index.css' //全局样式
import App from './App.tsx'

// ！ 非空断言操作符
// 开始渲染React组件APP到根节点root 函数参数是要渲染的React元素
// 为什么需要挂载机制：
// 1：写JSX代码 → 2. Vite/Webpack编译 → 3. 生成JavaScript → 4. 浏览器执行 → 5. 挂载到DOM → 6. 更新DOM
// 1：建立虚拟DOM和真实DOM的连接 管理组件生命周期 优化DOM更新性能 支持React的异步渲染机制 支持React的错误边界处理 支持React的性能优化 支持React的国际化

createRoot(document.getElementById('root')!).render(
  //严格模式会故意执行两次某些函数来检测副作用：State更新函数 useEffect回调 事件处理函数
  <StrictMode>
    <App />
  </StrictMode>,
)
