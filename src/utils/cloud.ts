/* eslint-disable @typescript-eslint/no-unused-vars */
import CryptoJS from 'crypto-js';
import send, { CORS_URL } from './request';

const HOST = 'tcb.tencentcloudapi.com';

export async function post() {
  const data = await send(CORS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  });
}

type RequestParams = {
  action: string;
};

type RequestPayload = {
  [key: string]: any;
};

window.CryptoJS = CryptoJS;

function getUTCDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function hash(payload: string) {
  const headers = {
    'content-type': 'application/json',
    host: HOST,
  };
  const headerKeys = Object.keys(headers).sort();
  const signedMethod = 'POST';
  const signedUri = '/';
  const signedQuery = '';
  const signedHeaders = headerKeys.map((key) => `${key}:${headers[key]}\n`);
  const signedHeaderKeys = headerKeys.join(';');
  const signedPayload = CryptoJS.SHA256(payload);

  return [
    signedMethod,
    signedUri,
    signedQuery,
    signedHeaders,
    signedHeaderKeys,
    signedPayload,
  ].join('\n');
}

function encode(payload: RequestPayload, now: Date) {
  const algorithm = 'TC3-HMAC-SHA256';
  const timestamp = Math.round(now.getTime() / 1000);
  const scope = `${getUTCDateString(now)}/tcb/tc3_request`;
  const hashed = hash(String(payload));

  return [algorithm, timestamp, scope, hashed].join('\n');
}

function sign(key: string, payload: RequestPayload, now: Date) {
  const toSign = encode(payload, now);
  const date = CryptoJS.HmacSHA256(`TC3${key}`, getUTCDateString(now));
  const service = CryptoJS.HmacSHA256(date, 'tcb');
  const secret = CryptoJS.HmacSHA256(service, 'tc3_request');

  return CryptoJS.HmacSHA256(secret, toSign);
}

export const cloud = {
  request(action: string, payload: RequestPayload) {
    const headers = {
      'content-type': 'application/json',
      host: HOST,
      'X-TC-Action': action,
      'X-TC-Timestamp': Math.round(Date.now() / 1000),
      'X-TC-Version': '2017-03-12',
      Authorization: '',
    };
  },
};
