import React from 'react';
import FileList, { useEnv } from '@/components/Storage/FileList';
import { showUpload } from '@/components/Storage/Upload';

export default () => {
  const env = useEnv();
  return <FileList env={env} onUploadClick={showUpload} />;
};
