import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/pages/layout';
import ChatBotPage from '@/pages/chat-bot';
import ExpandPage from '@/pages/expand';
import WorkspacePage from '@/pages/workspace';
import { CozeAgent } from '@/pages/coze-agent';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <ChatBotPage />, 
      },
      {
        path: '/expand',
        element: <ExpandPage />,
      },
      {
        path: '/expand/coze-agent',
        element: <CozeAgent />,
      },
      {
        path: '/workspace',
        element: <WorkspacePage />,
      },
    ],
  },
]);