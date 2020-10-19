import React from 'react';
import { cloud } from '@/utils/cloud';
import styles from './index.less';

export default () => {
  (async () => {
    console.log(await cloud.request('DescribeEnvs', {}));
    console.log(await cloud.request('ModifyEnv', {}));
  })();
  return (
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
};
