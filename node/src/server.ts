import express from 'express'
import { authorize, generateAuthUrl, getOAuth2Client, getToken, insertEvent, listEvents } from './services/google_calendar'
import { Token } from 'entity/Token'
import { ApiResponse } from 'entity/Api'
import { deleteTokenDoc, encryptToken, findTokenData, findTokenDoc, storeToken } from './repositories/token'
import { config } from 'dotenv'
import CryptoJS from 'crypto-js'
import mysql from 'mysql'
import dayjs from 'dayjs'

// .envをprocess.envに割当て
config()
const env = process.env
const PORT = env.NODE_PORT
const app = express()
app.use(express.json())

const connection = mysql.createConnection({
  host: '34.146.179.92',
  user: 'root',
  password: 'secret',
  database: 'sample'
})

const makeResponse = (status: number, data?: any): ApiResponse => {
  if (status === 200) {
    return { status: 200, message: 'ok' }
  } else if (status === 200 && !data) {
    return {
      status: 200,
      message: 'ok',
      data: data,
    }
  } else if (status === 400) {
    console.log('Bad request')
    return { status: 400, message: 'bad request'}
  } else if (status === 503) {
    return { status: 503, message: 'server error' }
  } else {
    return { status: 0, message: '' }
  }
}

// アクセスコード生成用ページ
app.get('/', async (req, res) => {
  const url = await generateAuthUrl()
  res.render('top.ejs', { url: url })
})

// トークン発行API
app.get('/google-start', async (req, res) => {
  const accessCode = String(req.query.accessCode)
  const storeId = String(req.query.storeId)
  const seatId = Number(req.query.seatId)
  if (accessCode === 'undefined' || storeId === 'undefined' || isNaN(seatId)) {
    res.json(makeResponse(400))
    return
  }

  try {
    const tokenDoc = await findTokenDoc(storeId, seatId)
    // トークン情報が存在する場合は該当のトークン情報を削除してから処理を行う
    if (tokenDoc.exists) {
      console.log('Token already exists')
      await deleteTokenDoc(tokenDoc)
      console.log('Old token deleted')
    }

    let oAuth2Client = await authorize()
    console.log('Google authorize completed')
  
    oAuth2Client = await getToken(oAuth2Client, accessCode)
    console.log('Get token is completed')
  
    await storeToken(storeId, seatId, oAuth2Client)
    console.log('Save token is completed')
  
    res.json(makeResponse(200))
    return
  } catch (e) {
    console.error(e)
    res.json(makeResponse(503));
  }
})

// スケジュール取得
app.get('/google-get', async (req, res) => {
  const storeId = String(req.query.storeId)
  const seatId = Number(req.query.seatId)
  const timeMin: string = (new Date()).toISOString()
  const eventCount: number = 1

  if (storeId === 'undefined' || isNaN(seatId)) {
    res.json(makeResponse(400))
    return
  }

  try {
    const tokenInfo = await findTokenData(storeId, seatId)
    console.log('Get token data from firestore is completed')
    const oAuth2Client = await getOAuth2Client(tokenInfo)
    const events = await listEvents(oAuth2Client, timeMin, eventCount)
    res.status(200).send(events)
    return
  } catch (e) {
    console.error(e)
    res.json(makeResponse(503));
  }
})

// イベント挿入
app.get('/google-create', async (req, res) => {
  const storeId: string = String(req.query.storeId)
  const seatId: number = Number(req.query.seatId)
  // 1時間後に1時間の適当な予定が入るようにする
  const startDateTime = dayjs().add(1, 'h').format()
  const endDateTime = dayjs().add(2, 'h').format()

  if (storeId === 'undefined' || isNaN(seatId)) {
    res.json(makeResponse(400))
    return
  }

  const event = {
    summary: 'APIから追加した予定',
    description: '説明',
    location: '東京駅',
    start: {
      dateTime: startDateTime, 
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Tokyo',
    },
  }

  try {
    const tokenInfo = await findTokenData(storeId, seatId)
    console.log('Get token data from firestore is completed')

    const oAuth2Client = await getOAuth2Client(tokenInfo)
    const statusText = await insertEvent(oAuth2Client, event)
    res.status(200).send(statusText)
    return
  } catch (e) {
    console.error(e)
    res.json(makeResponse(503))
  }
})

app.get('/google-inactive', async (req, res) => {
  console.log('start google inactive')
  const storeId: string = String(req.query.storeId)
  const seatId: number = Number(req.query.seatId)

  if (storeId === 'undefined' || isNaN(seatId)) {
    res.json(makeResponse(400))
    return
  }

  try {
    const tokenDoc = await findTokenDoc(storeId, seatId)
    await deleteTokenDoc(tokenDoc)
    res.json(makeResponse(200))
    return
  } catch (e) {
    console.error(e)
    res.json(makeResponse(503))
  }
})

/**
 * cloud sqlの接続テスト
 */
app.get('/db-test', (req, res) => {
  try {
    connection.connect((err: any) => {
      if (err) {
        console.log('error connecting: ' + err.stack);
        return
      }
      console.log('db connect success');
    })
    connection.query(
      'SELECT * FROM tokens',
      (error: any, results: Token[]) => {
        console.log(results)
      }
    )
    res.json(makeResponse(200))
  } catch (e) {
    console.log(e)
    res.json(makeResponse(503))
  }
})

// 暗号化・復号化のお試し
app.get('/encrypt-decrypt', (req, res) => {
  const str = "test"
  const encryptionKey = env.ENCRYPTION_KEY
  if (encryptionKey) {
    const encrypted = CryptoJS.AES.encrypt(str, encryptionKey).toString()
    // toStringでBase64フォーマットの文字列に変換
    console.log(`暗号化後 : ${encrypted}`)
  
    const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey)
    console.log(`復号化後 : ${decrypted.toString(CryptoJS.enc.Utf8)}`)
  }
  res.json(makeResponse(200))
})

// 暗号化・復号化キー生成
app.get('/generate-new-key', (req, res) => {
  // PBKDF2 : 共通鍵暗号用の鍵を生成する鍵導出関数
  const salt = CryptoJS.lib.WordArray.random(128/8)
  const key256Bits = CryptoJS.PBKDF2("Secret Passphrase", salt, { keySize: 256/32 })
  console.log(key256Bits.toString())
  res.json({ encoded_key: key256Bits.toString() })
})

app.get('/token-encrypt-test', async (req, res) => {
  const storeId: string = String(req.query.storeId)
  const seatId: number = Number(req.query.seatId)

  const tokenInfo = await findTokenData(storeId, seatId)
  const result = await encryptToken(tokenInfo.accessToken)
  res.json(result)
})

app.listen(PORT, () => {
  console.log(`Express running on https://localhost:${env.HTTPS_PORT}`)
})
