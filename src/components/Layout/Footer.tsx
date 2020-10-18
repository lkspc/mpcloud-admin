import React from 'react';
import { DefaultFooter } from '@ant-design/pro-layout';
import { GithubOutlined } from '@ant-design/icons';

export default () => {
  const showLinks = false;
  const links = [
    {
      key: 'github',
      title: <GithubOutlined />,
      href: 'https://github.com/lkspc/mpcloud-admin',
      blankTarget: true,
    },
  ];

  return (
    <DefaultFooter
      copyright={`${new Date().getFullYear()} MPCloud Admin`}
      links={showLinks ? links : []}
    />
  );
};
