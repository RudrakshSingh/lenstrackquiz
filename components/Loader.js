import styles from './Loader.module.css';

export default function Loader({ message = "Loading...", fullScreen = false }) {
  return (
    <div className={`${styles.loaderContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.loaderContent}>
        <div className={styles.spinnerWrapper}>
          <div className={styles.spinner}></div>
          <div className={styles.spinnerRing}></div>
        </div>
        {message && <p className={styles.loaderText}>{message}</p>}
      </div>
    </div>
  );
}

