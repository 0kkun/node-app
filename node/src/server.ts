import express from 'express'
const google = require("googleapis");
import docs from '@googleapis/docs'
import fs, { open } from 'fs'
import GoogleCal from './googleCal'
import GoogleService from './googleService';
import { Config, Credentials } from 'entity/GoogleApi'
require('dotenv').config();
import { Token } from 'entity/Token';
const request = require('request');

const mysql = require('mysql');
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

app.get('/', (req, res) => {
  res.render('top.ejs', {
    url: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&response_type=code&client_id=472259460876-tomdtkgt2mgonhg2mkqen71em0jo1pc8.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A3443'
  })
})

app.get('/tokenValid', (req, res) => {
  const accessToken = 'ya29.a0ARrdaM9H9AObXu_nHNOVARJ_u78qa8Y88Zp0t5Y_Ov2XOHrZLi4lPTK8oj5BK3S3JdFv-tYE-M57TDju0OnXMqutUDBaWAkr8W_fNSKFI_jezvXVBMdx4enzE-ASoM4hLP57JSvU97ltMXNe2KvINv6uuMGh';
  const url = 'https://www.googleapis.com/oauth2/v3/tokeninfo'
  const isValid = request.get({
    uri: url,
    headers: {'Content-type': 'application/json'},
    qs: {
      'access_token': accessToken
    },
    json: true
  }, function(err: any, req: any, data: any){
      console.log(data);
  });
  // console.log(isValid);
  res.json({status:200, data:'success'});
})

app.get('/synctest', (req: any, res) => {
  const code = String(req.query.code);
  console.log('code', code);
  if (code === 'undefined') {
    res.json({status:400, data: 'bad request'});
  }
  // const googleService = new GoogleService(code);
  // googleService.connect().then((OAuth2Client: any) => {
  //   console.log(`access_token : ${OAuth2Client.credentials.access_token}`);
  //   console.log(`refresh_token : ${OAuth2Client.credentials.refresh_token}`);
  // });
  res.json({status:200, data:'success'});
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

app.get('/api/v1/google_test', (req, res) => {

  const googleCal = new GoogleCal;
  googleCal.connect()
  .then((OAuth2Client: any) => {
    console.log(`access_token : ${OAuth2Client.credentials.access_token}`);
    console.log(`refresh_token : ${OAuth2Client.credentials.refresh_token}`);
    let dateTime = dateConvert(OAuth2Client.credentials.expiry_date);
    console.log(`アクセストークンが使えなくなる期限 : ${dateTime}`);
    let expireDateForRefresh = new Date().getTime() + OAuth2Client.eagerRefreshThresholdMillis;
    expireDateForRefresh = new Date(expireDateForRefresh);
    console.log(`refresh token expiered at : ${expireDateForRefresh.toLocaleString()}`);
    return;
    // return googleCal.getTodayEvents((_val: any) => !_val.id.match(/#/)); // 誕生日や祝日のカレンダーは取得対象から除外
  })
  // .then((val: any) => {
  //   console.log('failed')
  //   console.log(val);
  // });
  res.json({status:200, data:'OK'})
})

function dateConvert(expierDate: number) {
  let date = new Date(expierDate);
  return date.getFullYear() + '-' +('0' + (date.getMonth()+1)).slice(-2)+ '-' + ('0' + date.getDate()).slice(-2) + ' '+ date.getHours()+ ':'+('0' + ( date.getMinutes())).slice(-2)+ ':'+ date.getSeconds()
}

app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`)
});
