export type AdapterType = 'local' | 'session';

function getAdapter(type: AdapterType) {
  switch (type) {
    case 'local':
      return localStorage;
    case 'session':
      return sessionStorage;
    default:
      return localStorage;
  }
}

export const storage = {
  getItem<T>(key: string, type: AdapterType = 'local'): T | null {
    const adpater = getAdapter(type);
    const value = adpater.getItem(key);
    return JSON.parse(value ?? 'null');
  },
  setItem<T>(key: string, value: T, type: AdapterType = 'local') {
    const adpater = getAdapter(type);
    adpater.setItem(key, JSON.stringify(value));
  },
  removeItem(key: string, type: AdapterType = 'local') {
    const adpater = getAdapter(type);
    adpater.removeItem(key);
  },
  clear(type: AdapterType = 'local') {
    const adpater = getAdapter(type);
    adpater.clear();
  },
};

export default storage;
