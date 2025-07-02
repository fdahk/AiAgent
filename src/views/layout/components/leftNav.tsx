import leftNavStyles from './leftNav.module.scss';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '../context/chatContext';
import { useState, useEffect } from 'react';

function LeftNav() {
    const navigate = useNavigate();
    const { clearChat, messages, saveCurrentChat, getSavedChats, loadChat, isHistoryChat } = useChatContext();
    const handleClickNewChat = () => {
        //保存当前对话
        if (messages.length > 0 && !isHistoryChat) {
            saveCurrentChat();
        }
        clearChat();
        navigate('/');
    }
    const handleClickExpand = () => {
        navigate('/expand');
    }
    // 历史对话
    const [showHistory, setShowHistory] = useState(false);
    // useState(() => getSavedChats()) 这种写法会在组件初始化时立即执行getSavedChats()，可能还没有完全准备好Context
    const [savedChats, setSavedChats] = useState<any[]>([]); // 初始化为空数组
    // 使用useEffect在组件挂载后初始化数据
    useEffect(() => {
        setSavedChats(getSavedChats());
    }, [getSavedChats]);
    
    const handleClickHistory = () => {
        if (!showHistory) {
            // 刷新保存的对话列表
            setSavedChats(getSavedChats());
        }
        setShowHistory(!showHistory);
    }
    
    // 加载历史对话
    const handleLoadChat = (chatId: string) => {
        loadChat(chatId);
        navigate('/'); // 导航到主页面
    }
    
    // 左侧导航栏
    return(
        <div className={leftNavStyles.left_nav_container}>
            {/* logo */}
            <div className={leftNavStyles.left_nav_header}>
                <img src="\src\assets\logo.png" alt="logo" />
                <h2>Ai-Agent</h2>
            </div>
            {/* 导航栏 */}
            <div className={leftNavStyles.left_nav_body}>
                <div className={leftNavStyles.left_nav_item} onClick={handleClickNewChat}>
                    <label htmlFor="">+</label>
                    <p>新对话 ({messages.length}条消息)</p>
                </div>
                <div className={leftNavStyles.left_nav_item} onClick={handleClickExpand}>
                    <label htmlFor="">+</label>
                    <p>扩展</p>
                </div>
                <div className={leftNavStyles.left_nav_item} onClick={handleClickHistory}>
                    <label htmlFor="">+</label>
                    <p>历史对话 ({savedChats.length})</p>
                </div>
                {showHistory && (
                        <div className={leftNavStyles.history_list}>
                            {savedChats.length === 0 ? (
                                <div className={leftNavStyles.history_item}>
                                    <label htmlFor="">-</label>
                                    暂无历史对话
                                </div>
                            ) : (
                                savedChats.map((chat) => (
                                    <div 
                                        key={chat.id} 
                                        className={leftNavStyles.history_item}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLoadChat(chat.id);
                                        }}
                                    >   
                                        <label htmlFor="" style={{marginRight: '10px'}}>-</label>
                                        <p>{chat.title}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
            </div>
        </div>
    )
}

export default LeftNav;