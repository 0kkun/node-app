import { TokenInfo } from 'entity/Token'
import { firestore } from 'firebase-admin'
import { OAuth2Client } from 'google-auth-library'
import { findDoc } from '../helper'
import { db } from '../../lib/firebaseAdmin'



const collectionPath = (storeId: string, seatId: number): string => {
  return `token/${storeId}/seat/${seatId}`
}

const dateConvert = (expierDate: number | null | undefined): string => {
  if (expierDate) {
    const date = new Date(expierDate)
    return date.getFullYear() + '-' + 
      ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
      ('0' + date.getDate()).slice(-2) + ' ' +
      date.getHours() + ':' + 
      ('0' + (date.getMinutes())).slice(-2) + ':' +
      date.getSeconds()
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
  oAuth2Client: OAuth2Client
) => {
  const data: TokenInfo = {
    storeId: storeId,
    accessToken: oAuth2Client.credentials.access_token ?? '',
    refreshToken: oAuth2Client.credentials.refresh_token ?? '',
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
  oAuth2Client: OAuth2Client
): Promise<void> => {
  const data = {
    accessToken: oAuth2Client.credentials.access_token ?? '',
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
export const findTokenData = async (storeId: string, seatId: number): Promise<TokenInfo> => {
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
export const findTokenDoc = async (storeId: string, seatId: number) => {
  const tokenInfoDoc = await findDoc<TokenInfo>(collectionPath(storeId, seatId))
  return tokenInfoDoc
}