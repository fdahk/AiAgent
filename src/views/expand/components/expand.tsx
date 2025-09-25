import { DisplayCard } from './displayCard/index';

function Expand() {
    return (
        <>
            <div>
                <text>在这里去自己实现一些了解到的与AI相关的功能或者技术，不会AI的前端，前途将是一片黑暗😔---25.9.24</text> 
            </div>

            <div style={{padding: '20px'}}>
                <DisplayCard title="Coze工作流" description="AI智能体工作流相关学习" link="/workFlow" />
            </div>
        </>
        
    )
}

export default Expand;