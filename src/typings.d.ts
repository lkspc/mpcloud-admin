declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'byte-size';

// google analytics interface
interface GAFieldsObject {
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  eventValue?: number;
  nonInteraction?: boolean;
}
interface Window {
  ga: (
    command: 'send',
    hitType: 'event' | 'pageview',
    fieldsObject: GAFieldsObject | string,
  ) => void;
  reloadAuthorized: () => void;
}

declare let ga: Function;

// preview.pro.ant.design only do not use in your production ;
// preview.pro.ant.design 专用环境变量，请不要在你的项目中使用它。
declare let ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION: 'site' | undefined;

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | 'local' | false;

declare const SIMPLE_HEADER: 'true' | undefined;

declare const HIDE_LOCALE: 'true' | undefined;

declare module 'cos-js-sdk-v5' {
  export default class COS {
    constructor(opts: {
      getAuthorization: (
        options: Object,
        callback: (params: {
          TmpSecretId: string;
          TmpSecretKey: string;
          XCosSecurityToken: string;
          StartTime: number;
          ExpiredTime: number;
        }) => void,
      ) => any;
    });

    cancelTask(taskId: string): void;
    pauseTask(taskId: string): void;
    restartTask(taskId: string): void;
  }
}
