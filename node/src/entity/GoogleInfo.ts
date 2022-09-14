import firebase from 'firebase-admin'

export interface GoogleInfo {
  storeId: string
  seatId: number
  calendarId: string
  updatedAt: firebase.firestore.Timestamp
}
