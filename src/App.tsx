import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './App.css';

function App() {
  //新版本挂载路由
  return <RouterProvider router={router} />;
}

export default App;
