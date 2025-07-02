import { Outlet } from 'react-router-dom';
import Left from './components/leftNav';
import { ChatProvider } from './context/chatContext';

function Layout() {
  return (
    // JSX标签内的组件不会渲染，只是作为参数传递
    <ChatProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw'}}>
        {/* 左侧导航栏 */}
        <Left />
        {/* 二级页面 */}
        <div style={{ flex: 1 }}>
          <Outlet /> {/* 渲染子路由，不能直接通过 props 传递数据， */}
        </div>
      </div>
    </ChatProvider>
  );
}

export default Layout;