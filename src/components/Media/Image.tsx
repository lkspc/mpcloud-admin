import React from 'react';
import styles from './index.less';

export default ({ source }: { source: string }) => {
  return <img className={styles.image} src={source} alt="meida" />;
};
