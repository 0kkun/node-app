import express from 'express'
import { authorize, generateAuthUrl, getOAuth2Client, getToken, insertEvent, listEvents } from './services/google_calendar'
import { Token } from 'entity/Token'
import { findTokenData, findTokenDoc, storeToken } from './repositories/token'
const mysql = require('mysql')
require('dotenv').config()
const env = process.env
const PORT = env.NODE_PORT
const app = express()
app.use(express.json())

const connection = mysql.createConnection({
  host: '34.146.179.92',
  user: 'root',
  password: 'secret',
  database: 'sample'
});

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
    res.json({status:400, data:'bad request'})
  }

  try {
    const tokenDoc = await findTokenDoc(storeId, seatId)
    // 連携済の場合
    if (tokenDoc.exists) {
      res.json({status:200, data:'already'})
    }
    let oAuth2Client = await authorize()
    console.log('Google authorize completed')
  
    oAuth2Client = await getToken(oAuth2Client, accessCode)
    console.log('Get token is completed')
  
    await storeToken(storeId, seatId, oAuth2Client)
    console.log('Save token is completed')
  
    res.json({status:200, data:'success'});
  } catch (e) {
    console.error(e)
    res.json({status:503, data:'server error'});
  }
})

// スケジュール取得
app.get('/google-get', async (req, res) => {
  const storeId = String(req.query.storeId)
  const seatId = Number(req.query.seatId)
  const timeMin: string = (new Date()).toISOString()
  const eventCount: number = 1

  if (storeId === 'undefined' || isNaN(seatId)) {
    res.json({status:400, data:'bad request'})
  }

  try {
    const tokenInfo = await findTokenData(storeId, seatId)
    console.log('Get token data from firestore is completed')
    const oAuth2Client = await getOAuth2Client(tokenInfo)
    const events = await listEvents(oAuth2Client, timeMin, eventCount)
    res.status(200).send(events)

  } catch (e) {
    console.error(e)
    res.json({status:503, data:'server error'});
  }
})

// イベント挿入
app.get('/google-create', async (req, res) => {
  const storeId: string = String(req.query.storeId)
  const seatId: number = Number(req.query.seatId)
  const event = {
    summary: 'イベント名',
    description: '説明',
    location: '東京駅',
    start: {
      dateTime: '2022-06-30T09:00:00', 
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: '2022-06-30T10:00:00',
      timeZone: 'Asia/Tokyo',
    },
  }

  if (storeId === 'undefined' || isNaN(seatId)) {
    console.log('Bad request')
    res.status(400).send('Bad request. Must need [?storeId=&seatId=]')
  }

  try {
    const tokenInfo = await findTokenData(storeId, seatId)
    console.log('Get token data from firestore is completed')

    const oAuth2Client = await getOAuth2Client(tokenInfo)
    const statusText = await insertEvent(oAuth2Client, event)
    res.status(200).send(statusText)

  } catch (e) {
    console.error(e)
    res.json({status:503, data:'server error'});
  }
})

/**
 * cloud sqlの接続テスト
 */
app.get('/db-test', (req, res) => {
  connection.connect((err: any) => {
    if (err) {
      console.log('error connecting: ' + err.stack);
      return;
    }
    console.log('db connect success');
  });
  connection.query(
    'SELECT * FROM tokens',
    (error: any, results: Token[]) => {
      console.log(results);
    }
  );
  res.json({status:200, data:'OK'})
})

app.listen(PORT, () => {
  console.log(`Express running on https://localhost:${env.HTTPS_PORT}`)
});
