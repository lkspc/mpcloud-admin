import { Reducer, Effect } from 'umi';
import { cloud, ActionResult } from '@/utils/cloud';

export type CloudState = ActionResult<'DescribeEnvs'> & {
  currentEnvId?: string;
};

export type CloudModel = {
  namespace: string;
  state: CloudState;
  effects: {
    fetchEnvs: Effect;
  };
  reducers: {
    updateEnvs: Reducer<Partial<CloudState>>;
  };
};

const Model: CloudModel = {
  namespace: 'cloud',

  state: {
    RequestId: '',
    EnvList: [],
  },

  effects: {
    *fetchEnvs(_, { call, put }) {
      const { EnvList, RequestId }: ActionResult<'DescribeEnvs'> = yield call(() =>
        cloud.request('DescribeEnvs', {}),
      );

      yield put({
        type: 'updateEnvs',
        payload: {
          RequestId,
          EnvList,
          currentEnvId: EnvList.find((item) => item.IsDefault)?.EnvId,
        },
      });
    },
  },

  reducers: {
    updateEnvs(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};

export default Model;
