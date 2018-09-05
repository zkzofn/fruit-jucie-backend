import crypto from 'crypto-js';

export const secretToken = "fRu1t_token_privacy";
export const sessionTimeout = 60 * 60;  // 1 hour

export const makeSessionKey = (userInfoString) => {
  return crypto.AES.encrypt(userInfoString, secretToken).toString();
};

export const getAuthUser = (sessionKey) => {
  return JSON.parse(crypto.AES.decrypt(sessionKey, secretToken).toString(crypto.enc.Utf8));
};