import React, { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { Space, Button, List, Typography } from 'antd';
import { useSelector } from 'umi';
import Header from '@/components/Section/Header';
import wxcloud, { File as IFile } from '@/utils/wxcloud';
import { ConnectState } from '@/models/connect';
import _ from 'lodash';
import { Media, Skeleton } from '@/components/Media';
import styles from './index.less';

interface File extends IFile {
  Parent: string;
  Name: string;
  Ext: string;
  IsDirectory: boolean;
  Url: string;
}

interface FileStats {
  files: number;
  directories: number;
  items: { [key: string]: File[] };
}

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

function useFileStats(files: IFile[], cdn?: string, path: string = '') {
  const prevProps = useRef<{ files: IFile[]; cdn?: string }>({ files: [], cdn: undefined });
  const fileStats = useMemo(() => {
    const prevFiles = prevProps.current.files;
    const prevCdn = prevProps.current.cdn;
    prevProps.current = { files, cdn };

    // avoid fetching not found images when env changes
    const nextCdn = prevFiles === files && prevCdn !== cdn ? prevCdn : cdn;

    const stats: FileStats = {
      files: 0,
      directories: 0,
      items: {},
    };

    files.forEach((file) => {
      const delimeter = '.';
      const separator = '/';

      const IsDirectory = _.last(file.Key) === separator;
      const Path = IsDirectory ? _.trimEnd(file.Key, separator) : file.Key;
      const Index = Path.lastIndexOf(separator);
      const Parent = file.Key.slice(0, Math.max(Index, 0));
      const Name = _.trimEnd(file.Key.slice(Index + 1), separator);
      const Ext = Name.split(delimeter)[1] ?? '';

      if (!stats.items[Parent]) {
        stats.items[Parent] = [];
      }

      stats.files += Number(!IsDirectory);
      stats.directories += Number(IsDirectory);
      stats.items[Parent].push({
        ...file,
        Parent,
        Name,
        Ext,
        IsDirectory,
        Url: `//${nextCdn}/${file.Key}`,
      });
    });

    return {
      ...stats,
      items: stats.items[path] ?? [],
    };
  }, [files, cdn]);

  return fileStats;
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
  const [files, setFiles] = useState<IFile[]>([]);
  const stats = useFileStats(files, env?.cdn);

  const isEmpty = files.length === 0;
  const message =
    stats.directories > 0
      ? `共 ${stats.directories} 个目录，${stats.files} 个文件`
      : `共 ${stats.files} 个资源`;

  const getFiles = async () => {
    try {
      setLoading(true);
      const { Contents } = await wxcloud.storage.list({
        Bucket: env?.storage?.Bucket!,
        Region: env?.storage?.Region!,
      });
      const data = await wxcloud.storage.getUrl({
        Bucket: env?.storage?.Bucket!,
        Region: env?.storage?.Region!,
        Key: Contents[0].Key,
        Sign: false,
      });
      setFiles(Contents);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setFiles([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (env) {
      getFiles();
    }
  }, [env]);

  return (
    <section className={styles.storage}>
      <Header
        title="文件存储"
        count={files.length}
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
        pagination={!isEmpty && { showSizeChanger: true }}
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
