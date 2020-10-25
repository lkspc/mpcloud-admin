import React, { ReactNode, useMemo } from 'react';
import bytesize from 'byte-size';
import Image from './Image';
import Video from './Video';
import styles from './index.less';

export function Skeleton({
  className,
  loading = false,
  children,
}: {
  className?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={className}>
      <div className={styles.preview} />
      <div className={styles.short} />
      <div className={styles.long} />
    </div>
  );
}

function getMIMEType(ext?: string) {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'image';
    case 'mp4':
    case 'avi':
    case 'ogg':
      return 'video';
    case '':
    case undefined:
      return 'dir';
    default:
      return 'file';
  }
}

function formatBytes(bytes: number, decimals = 0) {
  const { value, unit } = bytesize(bytes, { precision: decimals });
  return !unit ? '0B' : `${value}${unit.toUpperCase()}`;
}

type Props = {
  source: string;
  name: string;
  size: number;
  ext?: string;
};

export function Media({ source, name, size, ext }: Props) {
  const type = getMIMEType(ext);
  const media = useMemo(() => {
    switch (type) {
      case 'dir':
        return <p>暂不支持目录管理</p>;
      case 'image':
        return <Image source={source} />;
      case 'video':
        return <Video source={source} />;
      default:
        return null;
    }
  }, [source, type]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.aspect}>
        <div className={styles.media}>{media}</div>
      </div>
      <div className={styles.desc}>
        <div className={styles.name}>{name}</div>
        <div className={styles.tag}>{type}</div>
      </div>
      {ext && (
        <div className={styles.extra}>
          {ext.toUpperCase()}&nbsp;&mdash;&nbsp;{formatBytes(size)}
        </div>
      )}
    </div>
  );
}
