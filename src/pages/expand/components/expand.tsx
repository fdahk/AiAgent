import { DisplayCard } from '@/components/display-card';

function Expand() {
    return (
        <>
            <div>
                <text>在这里去自己实现一些了解到的与AI相关的功能或者技术</text> 
            </div>

            <div style={{padding: '20px'}}>
                <DisplayCard title="Coze工作流" description="AI智能体工作流相关学习" link="/expand/coze-agent" />
            </div>
        </>
        
    )
}

export default Expand;