import React, { useEffect, useState } from 'react';
import { Space, Button, List, Typography } from 'antd';
import { useSelector } from 'umi';
import Header from '@/components/Section/Header';
import { ConnectState } from '@/models/connect';
import { File, FileStats, getFileStats } from '@/services/api';
import { Media, Skeleton } from '@/components/Media';
import styles from './index.less';

function selectEnv({ cloud }: ConnectState) {
  const { EnvList, currentEnvId } = cloud;
  const currentEnv = EnvList.find((env) => env.EnvId === currentEnvId);
  return currentEnv
    ? {
        storage: currentEnv.Storages?.[0],
        envId: currentEnv.EnvId,
        cdn: currentEnv.Storages?.[0].CdnDomain,
      }
    : undefined;
}

const fakeFiles: File[] = Array.from(
  { length: 11 },
  (item, i) =>
    ({
      Parent: '',
      Name: `fake${i}`,
      IsDirectory: false,
    } as any),
);

export default () => {
  const env = useSelector(selectEnv);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [stats, setStats] = useState<FileStats>({
    files: 0,
    directories: 0,
    items: [],
  });

  const isEmpty = stats.items.length === 0;
  const message =
    stats.directories > 0
      ? `共 ${stats.directories} 个目录，${stats.files} 个文件`
      : `共 ${stats.files} 个资源`;

  const getFiles = async () => {
    setLoading(true);

    try {
      const result = await getFileStats({
        Bucket: env?.storage.Bucket!,
        Region: env?.storage.Region!,
        CDN: env?.storage.CdnDomain!,
      });

      setStats(result);
    } catch (err) {
      console.log(err);
      setStats({
        files: 0,
        directories: 0,
        items: [],
      });
    }

    setLoading(false);
    setSelected([]);
  };

  useEffect(() => {
    if (env?.envId) {
      getFiles();
    }
  }, [env?.envId]);

  return (
    <section className={styles.storage}>
      <Header
        title="文件存储"
        count={stats.files}
        message={message}
        rightContent={
          <Space size="middle">
            <Button type="primary" danger disabled={selected.length === 0}>
              删除
            </Button>
            <Button type="primary">上传资源</Button>
          </Space>
        }
      />
      <List
        key={env?.envId}
        className={styles.list}
        loading={loading}
        pagination={!isEmpty && !loading && { showSizeChanger: true }}
        grid={{ gutter: 32, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
        dataSource={loading || isEmpty ? fakeFiles : stats.items}
        renderItem={(item) => (
          <List.Item>
            <Skeleton loading={loading || isEmpty}>
              <Media name={item.Name} source={item.Url} ext={item.Ext} size={Number(item.Size)} />
            </Skeleton>
          </List.Item>
        )}
      />
      {!loading && isEmpty && (
        <div className={styles.empty}>
          <Typography.Title level={5}>没有文件资源</Typography.Title>
          <Button type="primary">上传资源</Button>
        </div>
      )}
    </section>
  );
};
