import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/pages/layout';
import Chat from '@/pages/chat_bot';
import Home from '@/pages/expand';
import { CozeAgent } from '@/pages/cozeAgent';
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