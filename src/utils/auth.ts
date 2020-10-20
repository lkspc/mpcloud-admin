import { storage } from './storage';
import request, { CORS_URL } from './request';

const SYMBOL_TOKEN = 'token';
const SYMBOL_REMEMBER = 'remember';

export type MPToken = {
  access_token: string;
  expires: number;
};

export type CloudToken = {
  secret_id: string;
  secret_key: string;
  token: string;
  expired_time: number;
};

export type Crendential = {
  appid: string;
  secret: string;
};

export type Token = MPToken & CloudToken & Crendential;

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
export const auth = {
  isExpired(token: Token) {
    return token.expires < Date.now();
  },
  setToken(token: Token, remember: boolean = false) {
    storage.setItem(SYMBOL_REMEMBER, remember);
    storage.setItem(SYMBOL_TOKEN, token, remember ? 'local' : 'session');
  },
  clearToken() {
    storage.removeItem(SYMBOL_TOKEN, 'local');
    storage.removeItem(SYMBOL_TOKEN, 'session');
  },
  async getToken() {
    const remember = storage.getItem<boolean>(SYMBOL_REMEMBER, 'local');
    let token = storage.getItem<Token>(SYMBOL_TOKEN, remember ? 'local' : 'session');

    if (token && this.isExpired(token)) {
      const { appid, secret } = token;
      try {
        token = await this.refreshToken(appid, secret);
        this.setToken(token, !!remember);
      } catch (err) {
        token = null;
        auth.clearToken();
      }
    }

    return token;
  },
  async refreshToken(appid: string, secret: string): Promise<Token> {
    const mptoken = await getMPToken(appid, secret);
    const cloudtoken = await getCloudToken(mptoken.access_token);

    return {
      ...mptoken,
      ...cloudtoken,
      appid,
      secret,
    };
  },
};

export default auth;
