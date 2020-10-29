import React, { ComponentProps, FC, useEffect, useState } from 'react';
import { connect, ConnectProps } from 'umi';
import { ConnectState } from '@/models/connect';
import { Button, Row, Col, Card, Modal, Spin, Typography } from 'antd';
import { ActionResult } from '@/utils/cloud';
import styles from './index.less';

type EnvList = ActionResult<'DescribeEnvs'>['EnvList'];

const EnvModal: FC<
  ComponentProps<typeof Modal> & {
    data: EnvList;
    currentEnvId?: string;
    onChange?: (envId: string) => void;
  }
> = ({ currentEnvId, data, visible, onCancel, onOk, onChange }) => {
  const [envId, setEnvId] = useState<string | undefined>();

  const handleOk = (e: any) => {
    onOk?.(e);
    if (envId && envId !== currentEnvId) {
      onChange?.(envId);
    }
  };

  useEffect(() => {
    if (visible) {
      setEnvId(currentEnvId);
    }
  }, [visible]);

  return (
    <Modal
      width="auto"
      wrapClassName={styles.envmodal}
      title="切换环境"
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      maskClosable={false}
      closable={false}
    >
      <Row justify="center" gutter={[24, 24]}>
        {data.map((env) => (
          <Col key={env.EnvId} xs={24} sm={8} md={8} lg={8}>
            <Card
              key={env.EnvId}
              title={
                <>
                  <div
                    title={`${env.Alias}(${env.EnvId})`}
                    style={{
                      marginBottom: 8,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {env.Alias}({env.EnvId})
                  </div>
                  <div>{env.PackageName}</div>
                </>
              }
              style={{
                borderColor: env.EnvId === envId ? '#1890ff' : undefined,
              }}
              hoverable
              onClick={() => setEnvId(env.EnvId)}
            >
              <Row>
                <Col span={12}>
                  <Typography.Text type="secondary">来源</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text type="secondary">
                    {env.Source === 'miniapp' ? '微信小程序' : '腾讯云'}
                  </Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text type="secondary">支付方式</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text type="secondary">
                    {env.PayMode === 'prepayment' ? '预付费' : '后付费'}
                  </Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text type="secondary">状态</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text type="secondary">
                    {env.Status === 'NORMAL' ? '正常' : '不可用'}
                  </Typography.Text>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

type Props = {
  loading: boolean;
  envs: EnvList;
  currentEnvId?: string;
} & Partial<ConnectProps>;

const EnvDropdown: FC<Props> = ({ loading, envs, currentEnvId, dispatch }) => {
  const [visible, setVisible] = useState(false);

  const currentEnv = envs.find((env) => env.EnvId === currentEnvId);
  const envName = currentEnv && `${currentEnv.Alias}(${currentEnv.EnvId})`;

  const toggleVisible = () => {
    setVisible(!visible);
  };

  const handleEnvChange = (id: string) => {
    dispatch?.({
      type: 'cloud/updateEnvs',
      payload: {
        currentEnvId: id,
      },
    });
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
        <EnvModal
          data={envs}
          currentEnvId={currentEnvId}
          visible={visible}
          onCancel={toggleVisible}
          onOk={toggleVisible}
          onChange={handleEnvChange}
        />
      </div>
    </Spin>
  );
};

export default connect(({ cloud, loading }: ConnectState) => ({
  loading: !!loading.models.cloud,
  envs: cloud.EnvList,
  currentEnvId: cloud.currentEnvId,
}))(EnvDropdown);
