import { TokenInfo } from 'entity/Token'
import { firestore } from 'firebase-admin'
import { findDoc } from '../helper'
import { db } from '../../lib/firebaseAdmin'
import dayjs from 'dayjs'
import { Auth } from 'googleapis'
const CryptoJS = require('crypto-js')
require('dotenv').config()
const env = process.env

const collectionPath = (storeId: string, seatId: number): string => {
  return `token/${storeId}/seat/${seatId}`
}

const dateConvert = (expierDate: number | null | undefined): string => {
  if (expierDate != null) {
    return dayjs(expierDate).format('YYYY-MM-DD HH:mm:ss')
  } else {
    return ''
  }
}

/**
 * トークンの暗号化
 * @param token
 * @returns
 */
export const encryptToken = (
  token: string | null | undefined
): string => {
  if (token) {
    // toStringでBase64フォーマットの文字列に変換
    return CryptoJS.AES.encrypt(token, env.ENCRYPTION_KEY).toString()
  } else {
    return ''
  }
}

/**
 * トークンの復号化
 * @param token
 * @returns
 */
export const decryptToken = (
  token: string | null | undefined
): string => {
  if (token) {
    return CryptoJS.AES.decrypt(token, env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)
  } else {
    return ''
  }
}

/**
 * トークンをfirestoreへ保存する
 * @param storeId
 * @param oAuth2Client
 */
export const storeToken = async (
  storeId: string,
  seatId: number,
  oAuth2Client: Auth.OAuth2Client
) => {
  const data: TokenInfo = {
    storeId: storeId,
    accessToken: encryptToken(oAuth2Client.credentials.access_token),
    refreshToken: encryptToken(oAuth2Client.credentials.refresh_token),
    expiryDate: dateConvert(oAuth2Client.credentials.expiry_date),
    updatedAt: firestore.Timestamp.now(),
    seatId: seatId,
  }
  await db.doc(collectionPath(storeId, seatId)).set(data)
}

/**
 * トークンをアップデートする
 * @param storeId
 * @param roomId
 * @param oAuth2Client
 */
export const updateToken = async (
  storeId: string,
  seatId: number,
  oAuth2Client: Auth.OAuth2Client
): Promise<void> => {
  const data = {
    accessToken: encryptToken(oAuth2Client.credentials.access_token),
    expiryDate: dateConvert(oAuth2Client.credentials.expiry_date),
    updatedAt: firestore.Timestamp.now(),
  }
  await db.doc(collectionPath(storeId, seatId)).update(data)
}

/**
 * トークン情報を取得する
 * @param storeId
 * @param roomId
 * @returns
 */
export const findTokenData = async (
  storeId: string,
  seatId: number
): Promise<TokenInfo> => {
  const tokenInfoDoc = await findDoc<TokenInfo>(collectionPath(storeId, seatId))
  if (!tokenInfoDoc.exists) {
    throw new Error('token not found.')
  }
  return tokenInfoDoc.data()
}

/**
 * トークンがすでに登録済かどうか(google連携済)を返す
 * @param storeId
 * @param seatId
 * @returns
 */
export const findTokenDoc = async (
  storeId: string,
  seatId: number
) => {
  const tokenInfoDoc = await findDoc<TokenInfo>(collectionPath(storeId, seatId))
  return tokenInfoDoc
}
