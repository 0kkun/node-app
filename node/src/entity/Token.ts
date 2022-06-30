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
  accessToken: string | null | undefined
  refreshToken: string | null | undefined
  expiryDate: string
  updatedAt: firebase.firestore.Timestamp
}

export interface GoogleCalendarEvent {
  id?: string
  startTime?: string
  endTime?: string
  summary?: string
  location?: string
}

export interface GoogleInsertResponse {
  config: {}
  data: {}
  headers: {}
  status: number
  statusText: string
}