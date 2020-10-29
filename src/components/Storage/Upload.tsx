import React from 'react';
import { Modal } from 'antd';
import FileList from './FileList';

export function showUpload() {
  Modal.confirm({
    content: <FileList showHeader={false} />,
  });
}
