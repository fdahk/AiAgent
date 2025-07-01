import Chat from './components/chat';
import Left from './components/leftNav';
function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw'}}>
      <Left />
      <Chat />
    </div>
  );
}
export default Layout;