import request, { CORS_URL } from '@/utils/request';
import { Token } from '@/utils/auth';

export interface LoginParamsType {
  appid: string;
  secret: string;
}

export async function fakeAccountLogin(params: LoginParamsType) {
  return request('/api/login/account', {
    method: 'POST',
    data: params,
  });
}

export async function getFakeCaptcha(mobile: string) {
  return request(`/api/login/captcha?mobile=${mobile}`);
}

export async function login(appid: string, secret: string): Promise<Token> {
  const url = 'https://api.weixin.qq.com/cgi-bin/token';
  const res = await request<
    | {
        access_token: string;
        expires_in: number;
      }
    | {
        errcode: number;
        errmsg: string;
      }
  >(`${CORS_URL}/${url}`, {
    method: 'GET',
    params: {
      grant_type: 'client_credential',
      appid,
      secret,
    },
    credentials: undefined,
  });

  if ('errcode' in res) {
    throw new Error(res.errmsg);
  }

  return {
    access_token: res.access_token,
    expires: Date.now() + res.expires_in * 1000,
  };
}
