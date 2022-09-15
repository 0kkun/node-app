import firebase from 'firebase-admin'

export type Token = {
  RowDataPacket: {
    id: number,
    refresh_token: string,
    access_token: string,
    expier_date: string
  }
}

export interface TokenInfo {
  storeId: string
  seatId: number
  accessToken: string | null
  refreshToken: string | null
  expiryDate: string
  updatedAt: firebase.firestore.Timestamp
}

export interface GoogleCalendarEvent {
  id: string | null | undefined
  startTime: string | null | undefined
  endTime: string | null | undefined
  summary: string | null | undefined
  location: string | null | undefined
}
export interface GoogleInsertResponse {
  config: {}
  data: {}
  headers: {}
  status: number
  statusText: string
}