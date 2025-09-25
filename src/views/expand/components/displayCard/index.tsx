import styles from './style.module.scss';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type DisplayCardProps = {
    title: string;
    description: string;
    link: string;
}
export const DisplayCard = (props: DisplayCardProps) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
        className={styles.cardContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => navigate(props.link)}>
            <div className={`${styles.card} ${isHovered ? styles.flipped : ''}`}>
                {/* 标题 */}
                <div className={styles.cardFront}>
                    <div className={styles.title}>{props.title}</div>
                </div>
                {/* 描述 */}
                <div className={styles.cardBack}>
                    <div className={styles.description}>{props.description}</div>
                </div>
            </div>
        </div>
    )
}