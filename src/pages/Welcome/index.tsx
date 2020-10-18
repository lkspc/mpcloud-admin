import React from 'react';
import styles from './index.less';

export default () => (
  <div className={styles.container}>
    <div className={styles.content}>
      <h2>您好，欢迎使用！</h2>
      <div className={styles.wave}>
        <span role="img" aria-label="wave">
          👋
        </span>
      </div>
    </div>
  </div>
);
