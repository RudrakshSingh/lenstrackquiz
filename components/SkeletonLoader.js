import styles from './SkeletonLoader.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonIcon}></div>
        <div className={styles.skeletonTitle}></div>
      </div>
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine}></div>
        <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
        <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}

export function SkeletonButton() {
  return <div className={styles.skeletonButton}></div>;
}

export function SkeletonInput() {
  return <div className={styles.skeletonInput}></div>;
}

export function SkeletonOption() {
  return <div className={styles.skeletonOption}></div>;
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'button':
        return <SkeletonButton />;
      case 'input':
        return <SkeletonInput />;
      case 'option':
        return <SkeletonOption />;
      case 'card':
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ animationDelay: `${index * 0.1}s` }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

