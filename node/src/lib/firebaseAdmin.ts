import * as admin from 'firebase-admin'

const credential = require('./firestore-credentials.json')

admin.initializeApp({ credential: admin.credential.cert(credential) })

export const db = admin.firestore()