import React, { FC, useEffect, useState } from 'react';
import { connect, ConnectProps } from 'umi';
import { ConnectState } from '@/models/connect';
import { Button, Modal, Spin } from 'antd';
import { ActionResult } from '@/utils/cloud';
import styles from './index.less';

type Props = {
  loading: boolean;
  envs: ActionResult<'DescribeEnvs'>['EnvList'];
  currentEnvId?: string;
} & Partial<ConnectProps>;

const EnvDropdown: FC<Props> = ({ loading, envs, currentEnvId, dispatch }) => {
  const [visible, setVisible] = useState(false);

  const currentEnv = envs.find((env) => env.EnvId === currentEnvId);
  const envName = currentEnv && `${currentEnv.Alias}(${currentEnv.EnvId})`;

  const handleSwitch = () => {
    // setVisible(true);
  };

  const toggleVisible = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    dispatch?.({ type: 'cloud/fetchEnvs' });
  }, []);

  return (
    <Spin size="small" spinning={loading}>
      <div className={styles.env}>
        <div className={styles.text}>当前环境：{envName ?? '正在获取...'}</div>
        <Button
          size="small"
          type="primary"
          ghost
          disabled={envs.length === 0 || loading}
          onClick={toggleVisible}
        >
          切换
        </Button>
        <Modal
          width="auto"
          wrapClassName={styles.envmodal}
          title="切换环境"
          visible={visible}
          onCancel={toggleVisible}
          onOk={handleSwitch}
          maskClosable={false}
          closable={false}
        >
          <p>Hello</p>
          <p>Wolrd</p>
        </Modal>
      </div>
    </Spin>
  );
};

export default connect(({ cloud, loading }: ConnectState) => ({
  loading: !!loading.models.cloud,
  envs: cloud.EnvList,
  currentEnvId: cloud.currentEnvId,
}))(EnvDropdown);
