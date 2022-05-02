import express from 'express'
const google = require("googleapis"); // node実行だとrequireにしないといけない
import docs from '@googleapis/docs'
import fs, { open } from 'fs'
// import GoogleCal = require('googleCal');
import GoogleCal from './googleCal'
import { Config, Credentials } from 'entity/GoogleApi'
require('dotenv').config()

const env = process.env
const PORT = env.NODE_PORT
const app = express()
app.use(express.json())

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const CREDENTIAL_PATH = "./credentials.json";
const APP_NAME='CloudFunctionsSample';



app.get('/', (req, res) => {
  res.render('top.ejs', {url: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&response_type=code&client_id=472259460876-tomdtkgt2mgonhg2mkqen71em0jo1pc8.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A3443'})
})

app.get('/synctest', (req, res) => {

  const promiseSample = (value: any) => {
    return new Promise((resolve, reject) => {
      resolve(value)
    })
  }

  const asyncFunc = async() => {
    let res1 = await promiseSample('こんにちは')
    let res2 = await promiseSample('私は')
    let res3 = await promiseSample('とむです')
    console.log(res1);
    console.log(res2);
    console.log(res3);
  }

  asyncFunc();

  res.json({status:200, data:'OK'})
})

app.get('/api/v1/google_test', (req, res) => {

  const googleCal = new GoogleCal;
  googleCal.connect()
  .then((OAuth2Client: any) => {
    console.log(`access_token : ${OAuth2Client.credentials.access_token}`);
    console.log(`refresh_token : ${OAuth2Client.credentials.refresh_token}`);
    let dateTime = new Date(OAuth2Client.credentials.expiry_date);
    console.log(`アクセストークンが使えなくなる期限 : ${dateTime.toLocaleString()}`);
    let expireDateForRefresh = new Date().getTime() + OAuth2Client.eagerRefreshThresholdMillis;
    expireDateForRefresh = new Date(expireDateForRefresh);
    console.log(`refresh token expiered at : ${expireDateForRefresh.toLocaleString()}`);
    return;
    // return googleCal.getTodayEvents((_val: any) => !_val.id.match(/#/)); // 誕生日や祝日のカレンダーは取得対象から除外
  })
  .then((val: any) => {
    console.log('failed')
    console.log(val);
  });

  // const requestBody = {
  //   summary: "サンプル",
  //   description: "カレンダー説明",
  //   start: {
  //     dateTime: "2022-05-28T09:00:00-07:00",
  //     timeZone: "Asia/Tokyo",
  //   },
  //   end: {
  //     dateTime: "2022-05-28T17:00:00-08:00",
  //     timeZone: "Asia/Tokyo",
  //   },
  //   reminders: {
  //     useDefault: false,
  //     overrides: [
  //       {method: 'email', minutes: 120},
  //       {method: 'popup', minutes: 30},
  //     ],
  //   },
  // };

  // const auth = new google.auth.GoogleAuth({
  //   keyFile: CREDENTIAL_PATH,
  //   scopes: SCOPES,
  // });
  // console.log(auth);
  // const calendarId = "f0eajfdrujpccvti4hsadplogk@group.calendar.google.com";
  // const calendar = google.calendar({version: "v3", auth});
  // // const res = calendar.events.insert({auth, calendarId: calendarId, requestBody});
  res.json({status:200, data:'OK'})
})

app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`)
});
