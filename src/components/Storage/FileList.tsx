import React, { useEffect, useState } from 'react';
import { useSelector } from 'umi';
import { Space, Button, List, Typography } from 'antd';
import Header from '@/components/Section/Header';
import { CloudEnv } from '@/utils/cloud';
import { File, FileStats, getFileStats } from '@/services/api';
import { Media, Skeleton } from '@/components/Media';
import { ConnectState } from '@/models/connect';
import styles from './index.less';

export function useEnv() {
  return useSelector(({ cloud }: ConnectState) =>
    cloud.EnvList.find((item) => item.EnvId === cloud.currentEnvId),
  );
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

export type Props = {
  env?: CloudEnv;
  showHeader?: boolean;
  onUploadClick?: () => void;
  onDeleteClick?: (items: string[]) => void;
  selected?: string[];
  onSelectChange?: (selected: string[]) => void;
};

export default ({ env, showHeader = true, selected = [], onUploadClick, onDeleteClick }: Props) => {
  const [loading, setLoading] = useState(true);
  // const [selected, setSelected] = useState([]);
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
    if (!env?.EnvId) {
      return;
    }

    setLoading(true);

    try {
      const result = await getFileStats({
        Bucket: env.Storages[0].Bucket,
        Region: env.Storages[0].Region,
        CDN: env.Storages[0].CdnDomain,
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
  };

  const handleDelete = () => {
    onDeleteClick?.(selected);
  };

  useEffect(() => {
    getFiles();
  }, [env?.EnvId]);

  return (
    <section className={styles.storage}>
      {showHeader && (
        <Header
          title="文件存储"
          count={stats.files}
          message={message}
          rightContent={
            <Space size="middle">
              <Button type="primary" danger disabled={selected.length === 0} onClick={handleDelete}>
                删除
              </Button>
              <Button type="primary" onClick={onUploadClick}>
                上传资源
              </Button>
            </Space>
          }
        />
      )}

      <List
        key={env?.EnvId}
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
