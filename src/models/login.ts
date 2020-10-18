import { stringify } from 'querystring';
import { history, Reducer, Effect } from 'umi';
import { login } from '@/services/login';
import { setAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';
import auth, { Token } from '@/utils/auth';

export interface StateType {
  error?: string;
  authority?: 'user' | 'guest' | 'admin';
}

export interface LoginModelType {
  namespace: string;
  state: StateType;
  effects: {
    login: Effect;
    logout: Effect;
  };
  reducers: {
    changeLoginStatus: Reducer<StateType>;
  };
}

const Model: LoginModelType = {
  namespace: 'login',

  state: {
    error: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      try {
        const data: Token = yield call(login, payload.appid, payload.secret);
        auth.setToken(data, payload.remember);

        yield put({
          type: 'changeLoginStatus',
          payload: {},
        });

        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params as { redirect: string };
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = '/';
            return;
          }
        }
        history.replace(redirect || '/');
      } catch (err) {
        yield put({
          type: 'changeLoginStatus',
          payload: {
            error: err.message,
          },
        });
      }
    },

    *logout(_, { put }) {
      const { redirect } = getPageQuery();
      auth.clearToken();
      yield put({ type: 'changeLoginStatus', payload: { error: '' } });

      // Note: There may be security issues, please note
      if (window.location.pathname !== '/user/login' && !redirect) {
        requestAnimationFrame(() => {
          history.replace({
            pathname: '/user/login',
            search: stringify({
              redirect: window.location.href,
            }),
          });
        });
      }
    },
  },

  reducers: {
    changeLoginStatus(state, { payload }) {
      const authority = payload.error !== undefined ? 'guest' : 'admin';
      setAuthority(authority);
      return {
        ...state,
        error: payload.error,
        authority,
      };
    },
  },
};

export default Model;
