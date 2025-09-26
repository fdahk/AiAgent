import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/views/layout';
import Chat from '@/views/layout/components/chat';
import Home from '@/views/expand/index';
import { CozeAgent } from '@/views/expand/components/cozeAgent';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Chat />, 
      },
      {
        path: '/expand',
        element: <Home />,
      },
      {
        path: '/expand/cozeAgent',
        element: <CozeAgent />,
      },
    ],
  },
]);