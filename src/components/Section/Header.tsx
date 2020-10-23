import React, { FC, ReactNode } from 'react';
import { Col, Row, Typography } from 'antd';
import styles from './index.less';

const { Title, Text } = Typography;

const Header: FC<{
  title: string;
  count: number | string;
  message?: string;
  rightContent?: ReactNode;
}> = ({ title, count, message, rightContent }) => {
  return (
    <div className={styles.header}>
      <Row>
        <Col span={12}>
          <Title level={3}>{title}</Title>
          <Text type="secondary">{message ?? `共 ${count} 条数据`}</Text>
        </Col>
        <Col span={12} className={styles.right}>
          {rightContent}
        </Col>
      </Row>
    </div>
  );
};

export default Header;
