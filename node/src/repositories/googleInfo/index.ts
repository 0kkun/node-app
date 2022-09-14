import { GoogleInfo } from 'entity/GoogleInfo'
import { firestore } from 'firebase-admin'
import { Document, findDoc } from '../helper'
import { db } from '../../lib/firebaseAdmin'

const collectionPath = (storeId: string, seatId: number): string => {
  return `googleInfo/${storeId}/seat/${seatId}`
}

/**
 * 保存処理
 */
export const storeGoogleInfo = async (
  storeId: string,
  seatId: number,
  calendarId: string
): Promise<void> => {
  const data: GoogleInfo = {
    storeId: storeId,
    seatId: seatId,
    calendarId: calendarId,
    updatedAt: firestore.Timestamp.now(),
  }
  await db.doc(collectionPath(storeId, seatId)).set(data)
  console.log('googleInfo stored.')
}

/**
 * アップデート処理
 */
export const updateGoogleInfo = async (
  storeId: string,
  seatId: number,
  calendarId: string
): Promise<void> => {
  const data = {
    storeId: storeId,
    seatId: seatId,
    calendarId: calendarId,
    updatedAt: firestore.Timestamp.now(),
  }
  await db.doc(collectionPath(storeId, seatId)).update(data)
  console.log('googleInfo updated.')
}

/**
 * データ取得処理
 */
export const findGoogleInfoData = async (
  storeId: string,
  seatId: number
): Promise<GoogleInfo> => {
  const googleInfoDoc = await findDoc<GoogleInfo>(collectionPath(storeId, seatId))
  if (!googleInfoDoc.exists) {
    throw new Error('token not found.')
  }
  console.log('found googleInfo data.')
  return googleInfoDoc.data()
}

/**
 * ドキュメント取得処理
 */
export const findGoogleInfoDoc = async (
  storeId: string,
  seatId: number
): Promise<Document<GoogleInfo>> => {
  const googleInfoDoc = await findDoc<GoogleInfo>(collectionPath(storeId, seatId))
  console.log('found googleInfo doc.')
  return googleInfoDoc
}

/**
 * 削除処理
 */
export const deleteGoogleInfo = async (
  googleInfoDoc: Document<GoogleInfo>
): Promise<void> => {
  await googleInfoDoc.ref.delete()
  console.log('googleInfo deleted.')
  return
}
