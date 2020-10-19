import CryptoJS from 'crypto-js';
import { auth } from './auth';
import send, { CORS_URL } from './request';

type Words = string | CryptoJS.lib.WordArray;

type ActionParams = {
  DescribeEnvs: {};
  ModifyEnv: {
    EnvId: string;
    Alias?: string;
  };
};

type Action = keyof ActionParams;

type Response<T extends Object> = {
  Response: {
    RequestId: string;
    Error?: {
      Code: string;
      Message: string;
    };
  } & T;
};

const versions: { [a in Action]?: string } = {
  DescribeEnvs: '2018-06-08',
};

function sha256(message: Words, secret: Words, encode = false) {
  const words = CryptoJS.HmacSHA256(message, secret);
  return encode ? words.toString() : words;
}

function getHash(message: Words) {
  return CryptoJS.SHA256(message).toString();
}

function getUTCDate(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

function getTime() {
  return Math.round(Date.now() / 1000);
}

export const cloud = {
  host: 'tcb.tencentcloudapi.com',
  service: 'tcb',
  algorithm: 'TC3-HMAC-SHA256',

  getHeaders(action: Action, payload: string) {
    const cloudToken = auth.getToken();
    if (!cloudToken) {
      throw new Error('');
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { secret_id, secret_key, token } = cloudToken;
    const { host, service, algorithm } = this;
    const timestamp = getTime();
    const date = getUTCDate(timestamp);

    const headers = {
      'content-type': 'application/json',
      host,
    };
    const headerKeys = Object.keys(headers).sort();
    const signedHeaderKeys = headerKeys.join(';');
    const signedHeaders = headerKeys.map((key) => `${key}:${headers[key]}\n`).join('');

    const signedMethod = 'POST';
    const signedUri = '/';
    const signedQuery = '';
    const signedPayload = getHash(payload);

    // Step 1
    const requests = [
      signedMethod,
      signedUri,
      signedQuery,
      signedHeaders,
      signedHeaderKeys,
      signedPayload,
    ].join('\n');

    const hashedRequests = getHash(requests);
    const scope = `${date}/${service}/tc3_request`;

    // Step 2
    const toSign = [algorithm, timestamp, scope, hashedRequests].join('\n');

    const signedDate = sha256(date, `TC3${secret_key}`);
    const signedService = sha256(service, signedDate);
    const signedSecret = sha256('tc3_request', signedService);

    // Step 3
    const signature = sha256(toSign, signedSecret, true);

    // Step 4
    const authorization = [
      `${algorithm} Credential=${secret_id}/${scope}`,
      `SignedHeaders=${signedHeaderKeys}`,
      `Signature=${signature}`,
    ].join(', ');

    return {
      ...headers,
      authorization,
      'X-TC-Action': action,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Version': versions[action] ?? '2018-06-08',
      'X-TC-Token': token,
      'X-TC-Language': 'zh-CN',
    };
  },
  async request<T extends Object, A extends Action>(action: A, data: ActionParams[A]) {
    const payload = JSON.stringify(data);
    const headers = this.getHeaders(action, payload);
    const url = `${CORS_URL}/https://${this.host}`;
    const { Response } = await send<Response<T>>(url, {
      headers,
      method: 'POST',
      body: payload,
    });

    if (Response.Error) {
      throw new Error(Response.Error.Message);
    }

    return Response;
  },
};
