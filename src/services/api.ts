import wxcloud, { File as IFile } from '@/utils/wxcloud';
import _ from 'lodash';

export interface File extends IFile {
  Parent: string;
  Name: string;
  Ext: string;
  IsDirectory: boolean;
  Url: string;
}

export type FileStats = {
  files: number;
  directories: number;
  items: File[];
};

export async function getFileStats({
  Bucket,
  Region,
  CDN,
  path = '',
}: {
  Bucket: string;
  Region: string;
  CDN: string;
  path?: string;
}) {
  const { Contents } = await wxcloud.storage.list({ Bucket, Region });
  const stats = {
    files: 0,
    directories: 0,
    items: {},
  };

  Contents.forEach((file) => {
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
      Url: `//${CDN}/${file.Key}`,
    });
  });

  const data = await wxcloud.storage.getUrl({
    Bucket: Bucket!,
    Region: Region!,
    Key: (stats.items[path] ?? [])[0].Key,
    Sign: false,
  });
  console.log(data);

  return {
    ...stats,
    items: stats.items[path] ?? [],
  };
}
