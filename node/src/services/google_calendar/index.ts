import { GoogleCalendarEvent, TokenInfo } from 'entity/Token'
import { updateToken, decryptToken } from '../../repositories/token'
import { google, Auth, calendar_v3 } from 'googleapis'
import { GaxiosError, GaxiosResponse } from 'gaxios'
import { config } from 'dotenv'
import { CredentialBody } from 'google-auth-library'
import dayjs from '../../lib/dayjs'

// .envをprocess.envに割当て
config()
const env = process.env

/**
 * Credential情報を使ってgoogleインスタンスを生成する
 */
export const authorize = async (): Promise<Auth.OAuth2Client> => {
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
export const getOAuth2Client = async (
  tokenInfo: TokenInfo
): Promise<Auth.OAuth2Client> => {
  const isValidToken = await isWithinValidDate(String(tokenInfo.expiryDate))
  let oAuth2Client: Auth.OAuth2Client

  if (!isValidToken && tokenInfo.refreshToken !== null) {
    oAuth2Client = await refreshAccessToken(decryptToken(tokenInfo.refreshToken))
    console.log('Refresh access token process completed')
    await updateToken(tokenInfo.storeId, tokenInfo.seatId, oAuth2Client)
    console.log('Token data update completed')
  } else {
    oAuth2Client = await authorize()
    oAuth2Client.setCredentials({ access_token: decryptToken(tokenInfo.accessToken) })
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
export const getToken = async (
  oAuth2Client: Auth.OAuth2Client,
  accessCode: string
): Promise<Auth.OAuth2Client> => {
  const res = await oAuth2Client.getToken(accessCode)
  oAuth2Client.setCredentials(res.tokens)
  return oAuth2Client
}

/**
 * リフレッシュトークンでアクセストークンを再発行する
 * @param refreshToken 
 * @returns
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<Auth.OAuth2Client> => {
  const oAuth2Client = await authorize()
  oAuth2Client.credentials = {refresh_token: refreshToken}

  return new Promise((resolve, reject) => {
    oAuth2Client.refreshAccessToken((err: GaxiosError<any> | null, token: Auth.Credentials | null | undefined) => {
      if (err || token == null) {
        console.log('Could not get refresh token.', err)
        reject()
      } else {
        console.log('Completed acquisition of refresh token.')
        oAuth2Client.setCredentials(token)
        resolve(oAuth2Client)
      }
    })
  })
}

/**
 * アクセストークンが有効かどうか判定する
 * @param expierDate
 * @returns
 */
export const isWithinValidDate = async (
  expierDate: string
): Promise<boolean> => {
  const expire = new Date(expierDate)
  const now = getNowTimeJst()
  console.log('expire : ', expire)
  console.log('now : ', now)
  if (expire > now) {
    console.log('Access token is valid.')
    return true
  } else {
    console.log('Access token is invalid')
    return false
  }
}

/**
 * アクセスコード取得用のURLを生成する
 */
export const generateAuthUrl = async (): Promise<string> => {
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
export const listEvents = async (
  auth: Auth.OAuth2Client | any,
  timeMin: string,
  maxResults: number
): Promise<GoogleCalendarEvent[] | 'NOT_FOUND'> => {
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
    calendar.events.list(
      requestParam,
      (
        err: Error | null,
        res: GaxiosResponse<calendar_v3.Schema$Events> | null | undefined
      ) => {
      if (err || res == null || res.data.items == null) {
        console.log('The API returned an error: ' + err)
        reject()
        return
      } else {
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
          console.log('Events not found.')
          resolve('NOT_FOUND')
        }
      }
    })
  })
}

/**
 * カレンダーにスケジュールを登録する
 */
export const insertEvent = async (
  auth: Auth.OAuth2Client,
  event: calendar_v3.Schema$Event
): Promise<string> => {
  const calendar = google.calendar({ version: 'v3', auth })
  const requestParam = {
    auth: auth,
    calendarId: 'primary',
    requestBody: event
  }
  const response = await calendar.events.insert(requestParam)
  return response.statusText
}

/**
 * 現在日時をJSTで取得する
 */
const getNowTimeJst = (): Date => {
  const now = new Date()
  now.setTime(now.getTime() + 1000 * 60 * 60 * 9)
  return now
}

/**
 * サービスアカウントの認証
 */
export const saAuthorize = async (): Promise<Auth.GoogleAuth> => {
  const credentials: CredentialBody = {
    client_email: env.SA_CLIENT_EMAIL,
    private_key: env.SA_PRIVATE_KEY,
  }
  return new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

export const saListEvent = async (
  auth: Auth.GoogleAuth,
  timeMin: string,
  maxResults: number,
  calendarId: string
): Promise<GoogleCalendarEvent[] | 'NOT_FOUND' | 'INVALID_EMAIL'> => {
  console.log('Start fetch events from google calendar')
  const calendar = google.calendar({ version: 'v3', auth: auth })
  const requestParam = {
    calendarId: calendarId,
    timeMin: timeMin,
    maxResults: maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  }
  const results: GoogleCalendarEvent[] = []

  return new Promise((resolve, _) => {
    calendar.events.list(
      requestParam,
      (
        err: Error | null,
        res: GaxiosResponse<calendar_v3.Schema$Events> | null | undefined
      ) => {
      if (err || res == null || res.data.items == null) {
        console.log('The API returned an error: ' + err)
        resolve('INVALID_EMAIL')
        return
      } else {
        const events = res.data.items
        if (events.length) {
          console.log('Google event acquisition completed.')
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
          console.log('Finish fetch events from google calendar')
          resolve(results)
        } else {
          console.log('Finish fetch events from google calendar. Events not Found')
          resolve('NOT_FOUND')
        }
      }
    })
  })
}

/**
 * カレンダーにスケジュールを登録する
 */
export const saInsertEvent = async (
  auth: Auth.GoogleAuth,
  event: calendar_v3.Schema$Event,
  calendarId: string
): Promise<GaxiosResponse<calendar_v3.Schema$Event> | 'NOT_ENOUGH_AUTH'> => {
  console.log('Start insert event to google calendar')
  const calendar = google.calendar({ version: 'v3', auth })
  const requestParams: calendar_v3.Params$Resource$Events$Insert = {
    auth: auth,
    calendarId: calendarId,
    requestBody: event
  }

  return new Promise((resolve, _) => {
    calendar.events.insert(
      requestParams,
      (
        err: Error | null,
        res: GaxiosResponse<calendar_v3.Schema$Events> | null | undefined
      ) => {
        if (err || res === null || res === undefined) {
          console.log('The API returned an error: ' + err)
          resolve('NOT_ENOUGH_AUTH')
          return
        } else {
          console.log('Finish insert event to google calendar')
          resolve(res)
        }
      }
    )
  })
}

/**
 * サービスアカウント経由でイベントを削除する
 */
export const saDeleteEvent = async (
  auth: Auth.GoogleAuth,
  calendarId: string,
  eventId: string
): Promise<'SUCCESS' | 'NOT_ENOUGH_AUTH'> => {
  console.log('Google event delete start')
  const calendar = google.calendar({ version: 'v3', auth })
  const requestParams = {
    auth: auth,
    eventId: eventId,
    calendarId: calendarId,
  }

  return new Promise((resolve, _) => {
    calendar.events.delete(
      requestParams,
      (
        err: Error | null,
        res: GaxiosResponse<void> | null | undefined
      ) => {
        if (err || res === null || res === undefined) {
          console.log('The API returned an error: ' + err)
          resolve('NOT_ENOUGH_AUTH')
          return
        } else {
          console.log('Finish insert event to google calendar')
          resolve('SUCCESS')
        }
      }
    )
  })
}

/**
 * calendarIdが有効なものかチェックする
 */
export const checkCalendarId = async (
  calendarId: string
): Promise<'SUCCESS' | 'ERROR' | 'INVALID_EMAIL' | 'NOT_ENOUGH_AUTH'> => {
  console.log('Start service account connection.')
  const auth = await saAuthorize()
  const maxResult = 1
  const date = dayjs().tz('Asia/Tokyo')
  const now = date.format()
  const nowAddOne = date.add(1, 'hour').format()
  const nowAddTwo = date.add(2, 'hour').format()

  console.log('fetch start time : ', now)
  const listResponse = await saListEvent(auth, now, maxResult, String(calendarId))
  if (listResponse === 'INVALID_EMAIL') return listResponse

  const sampleEvent: calendar_v3.Schema$Event = {
    summary: 'API Test',
    description: 'Google連携確認用のイベントです',
    location: 'test',
    start: {
      dateTime: nowAddOne, 
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: nowAddTwo,
      timeZone: 'Asia/Tokyo',
    },
  }
  const insertResponse = await saInsertEvent(auth, sampleEvent, calendarId)
  if (insertResponse === 'NOT_ENOUGH_AUTH') return insertResponse

  const insertedEventId = insertResponse.data.id
  if (!insertedEventId) return 'ERROR'

  const deleteResponse = await saDeleteEvent(auth, calendarId, insertedEventId)
  if (deleteResponse === 'NOT_ENOUGH_AUTH') return 'NOT_ENOUGH_AUTH'

  return 'SUCCESS'
}