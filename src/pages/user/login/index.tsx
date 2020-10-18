import { AlipayCircleOutlined, TaobaoCircleOutlined, WeiboCircleOutlined } from '@ant-design/icons';
import { Alert, Checkbox } from 'antd';
import React, { useState } from 'react';
import { Link, connect, Dispatch } from 'umi';
import { StateType } from '@/models/login';
import { LoginParamsType } from '@/services/login';
import { ConnectState } from '@/models/connect';
import LoginForm from './components/Login';

import styles from './style.less';

const { UserName, Password, Submit } = LoginForm;
interface LoginProps {
  dispatch: Dispatch;
  userLogin: StateType;
  submitting?: boolean;
}

const LoginMessage: React.FC<{
  content?: string;
}> = ({ content }) =>
  content ? (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  ) : null;

const Login: React.FC<LoginProps> = (props) => {
  const { userLogin = {}, submitting } = props;
  const { error } = userLogin;
  const [autoLogin, setAutoLogin] = useState(true);

  const handleSubmit = (values: LoginParamsType) => {
    const { dispatch } = props;
    dispatch({
      type: 'login/login',
      payload: { ...values, remember: autoLogin },
    });
  };
  return (
    <div className={styles.main}>
      <LoginForm onSubmit={handleSubmit}>
        <LoginMessage content={!submitting ? error : undefined} />
        <UserName
          name="appid"
          placeholder="appid"
          rules={[
            {
              required: true,
              message: '请输入 APP ID!',
            },
          ]}
        />
        <Password
          name="secret"
          placeholder="appsecret"
          rules={[
            {
              required: true,
              message: '请输入 APP Secret!',
            },
          ]}
        />
        <div>
          <Checkbox checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)}>
            自动登录
          </Checkbox>
          <a
            style={{
              float: 'right',
              display: 'none',
            }}
          >
            忘记密码
          </a>
        </div>
        <Submit loading={submitting}>登录</Submit>
        <div className={styles.other}>
          其他登录方式
          <AlipayCircleOutlined className={styles.icon} />
          <TaobaoCircleOutlined className={styles.icon} />
          <WeiboCircleOutlined className={styles.icon} />
          <Link className={styles.register} to="/user/register">
            注册账户
          </Link>
        </div>
      </LoginForm>
    </div>
  );
};

export default connect(({ login, loading }: ConnectState) => ({
  userLogin: login,
  submitting: loading.effects['login/login'],
}))(Login);
