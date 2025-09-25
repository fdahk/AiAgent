import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/views/layout';
import Chat from '@/views/layout/components/chat';
import WorkFlow from '@/views/expand/components/workFlow';
import Home from '@/views/expand/index';
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
    ],
  },
]);