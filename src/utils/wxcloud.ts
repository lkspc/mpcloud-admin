import COS from 'cos-js-sdk-v5';
import request, { CORS_URL } from './request';
import { auth } from './auth';

export enum FileType {
  JSON = 1,
  CSV = 2,
}

export enum ConflictMode {
  INSERT = 1,
  UPSERT = 2,
}

export type File = {
  Key: string;
  ETag: string;
  Size: string;
  LastModified: string;
  Owner: {
    ID: string;
    DisplayName: string;
  };
};

export const cos = new COS({
  getAuthorization: async (_, callback) => {
    const token = await auth.getToken();
    if (!token) {
      auth.throwInvalid();
    } else {
      callback({
        TmpSecretId: token.secret_id,
        TmpSecretKey: token.secret_key,
        XCosSecurityToken: token.token,
        StartTime: Math.round(Date.now() / 1000),
        ExpiredTime: token.expired_time,
      });
    }
  },
});

function createCloudAction<P, T = void>(endpoint: string) {
  return async (data: P) => {
    const token = await auth.getToken();
    if (!token) {
      return auth.throwInvalid();
    }

    const url = `https://api.weixin.qq.com/tcb/${endpoint}`;
    const { errcode, errmsg, ...rest } = await request<{
      errcode: number;
      errmsg: string;
    }>(`${CORS_URL}/${url}`, {
      method: 'POST',
      params: {
        access_token: token.access_token,
      },
      data,
    });

    if (errcode !== 0) {
      throw new Error(errmsg);
    }

    return rest as T;
  };
}

function createCOSAction<P, T = void>(api: string) {
  return async (params: P) => {
    return new Promise<T>((resolve, reject) => {
      cos[api](
        params,
        (
          err: {
            statusCode: number;
            headers: Headers;
          } | null,
          data: T,
        ) => {
          return err ? reject(err) : resolve(data);
        },
      );
    });
  };
}

export const database = {
  import: createCloudAction<
    {
      env: string;
      collection_name: string;
      file_path: string;
      file_type: FileType;
      stop_on_error: boolean;
      conflict_mode: ConflictMode;
    },
    { job_id: number }
  >('databasemigrateimport'),
  export: createCloudAction<
    {
      env: string;
      file_path: string;
      file_type: FileType;
      query: string;
    },
    { job_id: number }
  >('databasemigrateexport'),
  migration: createCloudAction<
    {
      env: string;
      job_id: number;
    },
    {
      status: string;
      record_success: number;
      record_fail: number;
      err_msg: string;
      file_url: string;
    }
  >('databasemigratequeryinfo'),
};

export const collection = {
  create: createCloudAction<{
    env: string;
    collection_name: string;
  }>('databasecollectionadd'),
  delete: createCloudAction<{
    env: string;
    collection_name: string;
  }>('databasecollectiondelete'),
  list: createCloudAction<
    {
      env: string;
      limit?: number;
      offset?: number;
    },
    {
      pager: {
        Offset: number;
        Limit: number;
        Total: number;
      };
      collections: {
        name: string;
        count: number;
        size: number;
        index_count: number;
        index_size: number;
      }[];
    }
  >('databasecollectionget'),
};

export const document = {
  create: createCloudAction<
    {
      env: string;
      query: string;
    },
    { id_list: string[] }
  >('databaseadd'),
  update: createCloudAction<
    {
      env: string;
      query: string;
    },
    {
      matched: number;
      modified: number;
      id: string;
    }
  >('databaseupdate'),
  list: createCloudAction<
    {
      env: string;
      query: string;
    },
    {
      pager: {
        Offset: number;
        Limit: number;
        Total: number;
      };
      data: string[];
    }
  >('databasequery'),
  count: createCloudAction<
    {
      env: string;
      query: string;
    },
    { count: number }
  >('databasecount'),
};

export const storage = {
  getUploadUrl: createCloudAction<
    {
      env: string;
      path: string;
    },
    {
      url: string;
      token: string;
      authorization: string;
      file_id: string;
      cos_file_id: string;
    }
  >('uploadfile'),
  getDownloadUrl: createCloudAction<
    {
      env: string;
      file_list: { fileid: string; max_age: number }[];
    },
    {
      file_list: {
        fileid: string;
        download_url: string;
        status: number;
        errmsg: string;
      }[];
    }
  >('batchdownloadfile'),
  async upload({ env, path, file }: { env: string; path: string; file: Blob }) {
    const { url, token, authorization, cos_file_id } = await this.getUploadUrl({ env, path });

    const form = new FormData();
    form.append('key', path);
    form.append('Signature', authorization);
    form.append('x-cos-security-token', token);
    form.append('x-cos-meta-fileid', cos_file_id);
    form.append('file', file);

    await request<void>(`${CORS_URL}/${url}`, {
      method: 'POST',
      data: form,
    });
  },
  delete: createCloudAction<
    {
      env: string;
      file_list: string[];
    },
    {
      delete_list: {
        fileid: string;
        status: number;
        errmsg: string;
      }[];
    }
  >('batchdeletefile'),
  list: createCOSAction<
    {
      Bucket: string;
      Region: string;
      Prefix?: string;
      Delimiter?: string;
      Marker?: string;
      MaxKeys?: string;
      EncodingType?: 'url';
    },
    {
      Name: string;
      Prefix: string;
      Marker: string;
      MaxKeys: string;
      Delimiter: string;
      IsTruncated: 'true' | 'false';
      NextMarker: string;
      CommonPrefixes: {
        Prefix: string;
      }[];
      EncodingType: string;
      Contents: File[];
    }
  >('getBucket'),
  put: createCOSAction<
    {
      Bucket: string;
      Region: string;
      Key: string;
      Body: Blob | string;
      onTaskReady?: (taskId: string) => void;
      onProgress?: (progress: { loaded: number; speed: number; percent: number }) => void;
    },
    {
      statusCode: number;
      headers: {
        ETag: string;
        Location: string;
        VersionId: string;
      };
    }
  >('putObject'),
  getUrl: createCOSAction<
    {
      Bucket: string;
      Region: string;
      Key: string;
      Sign?: boolean;
      Expires?: number;
    },
    { Url: string }
  >('getObjectUrl'),
  cancel: (taskId: string) => {
    cos.cancelTask(taskId);
  },
};

export default {
  database,
  collection,
  document,
  storage,
  cos,
};
