import request, { CORS_URL } from '@/utils/request';
import { MPToken, CloudToken, Token } from '@/utils/auth';
import * as cloud from '@/utils/cloud';

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

export async function getMPToken(appid: string, secret: string): Promise<MPToken> {
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
  });

  if ('errcode' in res) {
    throw new Error(res.errmsg);
  }

  return {
    access_token: res.access_token,
    expires: Date.now() + res.expires_in * 1000,
  };
}

export async function getCloudToken(accessToken: string): Promise<CloudToken> {
  const url = 'https://api.weixin.qq.com/tcb/getqcloudtoken';
  const res = await request<{
    errcode: number;
    errmsage: string;
    secretid: string;
    secretkey: string;
    token: string;
    expired_time: number;
  }>(`${CORS_URL}/${url}`, {
    method: 'POST',
    params: { access_token: accessToken },
    data: { lifespan: 7200 },
  });

  if (res.errcode !== 0) {
    throw new Error(res.errmsage);
  }

  return {
    secret_id: res.secretid,
    secret_key: res.secretkey,
    token: res.token,
    expired_time: res.expired_time,
  };
}

// appid: wxbe8b9d759f13128b
// secret: 30bcefe84c505f9221f29a22ee60139a
export async function login(appid: string, secret: string): Promise<Token> {
  const mptoken = await getMPToken(appid, secret);
  const cloudtoken = await getCloudToken(mptoken.access_token);

  return {
    ...mptoken,
    ...cloudtoken,
  };
}

window.cloud = cloud;
