import CryptoJS from 'crypto-js';
import { auth } from './auth';
import send, { CORS_URL } from './request';

type Words = string | CryptoJS.lib.WordArray;

type ACL = 'READONLY' | 'PRIVATE' | 'ADMINWRITE' | 'ADMINONLY';

type Actions = {
  DescribeEnvs: (params: {
    EnvId?: string;
  }) => {
    RequestId: string;
    EnvList: {
      EnvId: string;
      Source: 'miniapp' | 'qcloud';
      Alias: string;
      Status: 'NORMAL' | 'UNAVAILABLE';
      CreateTime: string;
      UpdateTime: string;
      Databases: {
        InstanceId: string;
        Region: string;
        Status: 'INITIALIZING' | 'RUNNING' | 'UNUSABLE' | 'OVERDUE';
      }[];
      Storages: {
        Region: string;
        Bucket: string;
        CdnDomain: string;
        AppId: string;
      }[];
      Functions: {
        Namespace: string;
        Region: string;
      }[];
      PackageId?: string;
      PackageName?: string;
      IsAutoDegrade?: boolean;
      EnvChannel?: string;
      PayMode?: 'prepayment' | 'postpaid';
      IsDefault?: boolean;
      Region?: string;
    }[];
  };
  DescribeQuotaData: (params: {
    EnvId: string;
    MetricName: string;
    ResourceID?: string;
  }) => {
    RequestId: string;
    MetricName: string;
    value: number;
  };
  DescribeDatabaseACL: (params: {
    EnvId: string;
    CollectionName: string;
  }) => {
    RequestId: string;
    AclTag: ACL;
  };
  ModifyDatabaseACL: (params: {
    EnvId: string;
    CollectionName: string;
    AclTag: ACL;
  }) => {
    RequestId: string;
  };
  DescribeDownloadFile: (params: {
    CodeUri: string;
  }) => {
    RequestId: string;
    FilePath?: string;
    CustomKey?: string;
    DownloadUrl?: string;
  };
  DescribeEndUsers: (params: {
    EnvId: string;
    Offset?: number;
    Limit?: number;
  }) => {
    RequestId: string;
    Total: number;
    Users: {
      UserName: string;
      UUId: string;
      WXOpenId: string;
      Phone: string;
      Email: string;
      NickName: string;
      Gender: string;
      AvatarUrl: string;
      UpdateTime: string;
      CreateTime: string;
      IsAnonymous: string;
      IsDisabled: string;
      HasPassword: string;
    }[];
  };
  DestroyEnv: (params: {
    EnvId: string;
    IsForce?: boolean;
    BypassCheck?: boolean;
  }) => {
    RequestId: string;
  };
  Fake: (params: {}) => {};
};

export type Action = keyof Actions;

export type ActionFn<A extends Action> = Actions[A];

export type ActionParams<A extends Action> = Parameters<ActionFn<A>>[0];

export type ActionResult<A extends Action> = ReturnType<ActionFn<A>>;

export type Response<A extends Action> = {
  Response:
    | {
        RequestId: string;
        Error: {
          Code: string;
          Message: string;
        };
      }
    | ActionResult<A>;
};

const versions: { [a in Action]?: string } = {};

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

  async getHeaders(action: Action, payload: string) {
    const cloudToken = await auth.getToken();
    if (!cloudToken) {
      return auth.throwInvalid();
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
  async request<A extends Action>(action: A, data: ActionParams<A>) {
    const payload = JSON.stringify(data ?? {});
    const headers = await this.getHeaders(action, payload);
    const url = `${CORS_URL}/https://${this.host}`;
    const { Response } = await send<Response<A>>(url, {
      headers,
      method: 'POST',
      body: payload,
    });

    if ('Error' in Response) {
      throw new Error(Response.Error.Message);
    }

    return Response;
  },
};
