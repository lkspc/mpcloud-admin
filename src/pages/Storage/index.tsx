import React, { useEffect, useMemo, useState } from 'react';
import { Space, Button } from 'antd';
import { useSelector } from 'umi';
import Header from '@/components/Section/Header';
import wxcloud, { Response } from '@/utils/wxcloud';
import { ConnectState } from '@/models/connect';

type File = Response<typeof wxcloud.storage.list>;

function selectStorage({ cloud }: ConnectState) {
  const { EnvList, currentEnvId } = cloud;
  const currentEnv = EnvList.find((env) => env.EnvId === currentEnvId);
  return currentEnv?.Storages?.[0];
}

export default () => {
  const storage = useSelector(selectStorage);
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState<File[]>([]);
  const stat = useMemo(() => {
    return { dir: 1, file: 10 };
  }, [files]);

  const getFiles = async () => {
    try {
      const { Contents } = await wxcloud.storage.list({
        Bucket: storage!.Bucket,
        Region: storage!.Region,
      });
      setFiles(Contents);
      setSelected([]);
    } catch (err) {
      console.log(err);
      setFiles([]);
    }
  };

  useEffect(() => {
    if (storage) {
      getFiles();
    }
  }, [storage]);

  return (
    <section>
      <Header
        title="文件存储"
        count={files.length}
        message={`共 ${stat.dir} 个目录，${stat.file} 个文件`}
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
