import leftNavStyles from './leftNav.module.css';

function LeftNav() {
    return(
        <div className={leftNavStyles.left_nav_container}>
            <div className={leftNavStyles.left_nav_header}>
                <img src="\src\assets\logo.png" alt="logo" />
                <h2>Ai-Agent</h2>
            </div>
            <div className={leftNavStyles.left_nav_body}>
                <div className={leftNavStyles.left_nav_item}>
                    <label htmlFor="">+</label>
                    <p>新对话</p>
                </div>
            </div>
        </div>
    )
}

export default LeftNav;