import { storage } from './storage';

const SYMBOL_TOKEN = 'token';

export type Token = {
  access_token: string;
  expires: number;
};

export const auth = {
  getToken() {
    const sessionToken = storage.getItem<Token>(SYMBOL_TOKEN, 'session');
    const localToken = storage.getItem<Token>(SYMBOL_TOKEN, 'local');
    return sessionToken ?? localToken;
  },
  setToken(token: Token, remember: boolean = false) {
    storage.setItem(SYMBOL_TOKEN, token, remember ? 'local' : 'session');
  },
  clearToken() {
    storage.removeItem(SYMBOL_TOKEN, 'local');
    storage.removeItem(SYMBOL_TOKEN, 'session');
  },
  isValidToken(token: Token) {
    return token.expires > Date.now();
  },
  isValid() {
    const token = this.getToken();
    return token && this.isValidToken(token);
  },
};

export default auth;
