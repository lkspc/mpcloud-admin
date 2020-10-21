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

async function sendRequest<T = void>(url: string, data: Object) {
  const token = await auth.getToken();
  if (!token) {
    return auth.throwInvalid();
  }

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
}

function createRequestAction<P, T = void>(api: string) {
  return (params: P) => {
    const url = `https://api.weixin.qq.com/tcb/${api}`;
    return sendRequest<T>(url, params);
  };
}

export const database = {
  import: createRequestAction<
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
  export: createRequestAction<
    {
      env: string;
      file_path: string;
      file_type: FileType;
      query: string;
    },
    { job_id: number }
  >('databasemigrateexport'),
  migration: createRequestAction<
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
  create: createRequestAction<{
    env: string;
    collection_name: string;
  }>('databasecollectionadd'),
  delete: createRequestAction<{
    env: string;
    collection_name: string;
  }>('databasecollectiondelete'),
  list: createRequestAction<
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
  create: createRequestAction<
    {
      env: string;
      query: string;
    },
    { id_list: string[] }
  >('databaseadd'),
  update: createRequestAction<
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
  list: createRequestAction<
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
  count: createRequestAction<
    {
      env: string;
      query: string;
    },
    { count: number }
  >('databasecount'),
};

export const storage = {
  upload: createRequestAction<
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
  download: createRequestAction<
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
};

export default {
  database,
  collection,
  document,
  storage,
};
