import React, { useEffect, useState } from 'react';
import { Space, Button } from 'antd';
import Header from '@/components/Section/Header';

export default () => {
  const [selected, setSelected] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setSelected([]);
    setCount(2);
  }, []);

  return (
    <section>
      <Header
        title="文件存储"
        count={count}
        rightContent={
          <Space size="middle">
            <Button type="primary" danger disabled={selected.length === 0}>
              删除
            </Button>
            <Button type="primary">上传资源</Button>
          </Space>
        }
      />
    </section>
  );
};
