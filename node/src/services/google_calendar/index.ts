import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GoogleCalendarEvent, TokenInfo } from 'entity/Token'
import { updateToken } from '../../repositories/token'
import { GetTokenResponse } from 'googleapis-common/node_modules/google-auth-library/build/src/auth/oauth2client'
require('dotenv').config()

/**
 * Credential情報を使ってgoogleインスタンスを生成する
 */
export const authorize = async (): Promise<any> => {
  const env = process.env
  const credentials = {
    web: {
      clientSecret: env.CLIENT_SECRET,
      clientId: env.CLIENT_ID,
      redirectUris: env.REDIRECT_URI,
    }
  }
  const clientSecret = credentials.web.clientSecret
  const clientId = credentials.web.clientId
  const redirectUris = credentials.web.redirectUris

  return new google.auth.OAuth2(clientId, clientSecret, redirectUris)
}

/**
 * Google連携済みのOAuth2Clientを取得する
 * @param tokenInfo 
 */
export const getOAuth2Client = async (tokenInfo: TokenInfo): Promise<any> => {
  const isValidToken = await isWithinValidDate(String(tokenInfo.expiryDate))
  let oAuth2Client

  if (!isValidToken) {
    oAuth2Client = await refreshAccessToken(String(tokenInfo.refreshToken))
    console.log('Refresh access token process completed')
    await updateToken(tokenInfo.storeId, tokenInfo.seatId, oAuth2Client)
    console.log('Token data update completed')
  } else {
    oAuth2Client = await authorize()
    oAuth2Client.setCredentials({ access_token: tokenInfo.accessToken })
    console.log('Authentication completed')
  }
  return oAuth2Client
}

/**
 * トークンを取得する (連携初回)
 * @param oAuth2Client
 * @param accessCode
 * @returns
 */
export const getToken = async (oAuth2Client: OAuth2Client, accessCode: string): Promise<OAuth2Client> => {
  const res: GetTokenResponse = await oAuth2Client.getToken(accessCode)
  oAuth2Client.setCredentials(res.tokens)
  return oAuth2Client
}

/**
 * リフレッシュトークンでアクセストークンを再発行する
 * @param refreshToken 
 * @returns
 */
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
  const env = process.env
  const credentials = {
    web: {
      clientSecret: env.CLIENT_SECRET,
      clientId: env.CLIENT_ID,
      redirectUris: env.REDIRECT_URI,
    },
  }
  const clientSecret = credentials.web.clientSecret
  const clientId = credentials.web.clientId
  const redirectUris = credentials.web.redirectUris
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUris)

  oAuth2Client.credentials = {refresh_token: refreshToken}

  return new Promise((resolve, reject) => {
    oAuth2Client.refreshAccessToken((err, token: any) => {
      if (err) {
        console.log('Could not get refresh token.', err)
        reject()
      }
      console.log('Completed acquisition of refresh token.')
      oAuth2Client.setCredentials(token)
      resolve(oAuth2Client)
    })
  })
}

/**
 * アクセストークンが有効かどうか判定する
 * @param expierDate
 * @returns
 */
export const isWithinValidDate = async (expierDate: string): Promise<boolean> => {
  const expire = new Date(expierDate)
  const now = new Date()
  if (expire > now) {
    console.log('Access token is valid.')
    return true
  }
  else {
    console.log('Access token is invalid')
    return false
  }
}

/**
 * アクセスコード取得用のURLを生成する
 */
export const generateAuthUrl = async (): Promise<any> => {
  const oAuth2Client = await authorize()
  console.log('Google authorize completed')

  const authUrl = await oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  })
  return authUrl
}

/**
 * credentialセット済みのOAuth2を渡してカレンダー情報を取得する
 */
export const listEvents = async (auth: OAuth2Client | any, timeMin: string, maxResults: number): Promise<GoogleCalendarEvent[] | 'NOT_FOUND'> => {
  const calendar = google.calendar({ version: 'v3', auth })
  const requestParam = {
    calendarId: 'primary',
    timeMin: timeMin,
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  }
  const results: GoogleCalendarEvent[] = []

  return new Promise((resolve, reject) => {
    calendar.events.list(requestParam, (err: Error | any, res: null | any) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        reject()
        return
      }
      const events = res.data.items
      if (events.length) {
        console.log('Event acquisition completed.')
        events.map((event: any) => {
          results.push({
            id: event.id,
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
            summary: event.summary,
            location: event.location,
          })
        })
        console.log(results)
        resolve(results)
      } else {
        console.log('No upcoming events found.')
        resolve('NOT_FOUND')
      }
    })
  })
}

/**
 * カレンダーにスケジュールを登録する
 */
export const insertEvent = async (auth: any, event: any): Promise<string> => {
  const calendar = google.calendar({ version: 'v3', auth })
  const requestParam = {
    auth: auth,
    calendarId: 'primary',
    requestBody: event
  }
  const response = await calendar.events.insert(requestParam)
  return response.statusText
}
