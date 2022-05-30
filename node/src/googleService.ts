import fs from 'fs'
import readline from 'readline'
import {google} from 'googleapis'
import { Config, Credentials } from 'entity/GoogleApi'

export default class GoogleService {

  private accessCode: string;

  constructor(accessCode: string){
    this.accessCode = accessCode;
  }

  private config: Config = {
    scopes : ['https://www.googleapis.com/auth/calendar.readonly'],
    tokenPath : 'access-token.json',
    auth: {},
  };

  /**
   * google Calendar APIへの接続と認証
   */
  connect(): Promise<object> {
    const credentials = {
      "web": {
        "client_id": "472259460876-tomdtkgt2mgonhg2mkqen71em0jo1pc8.apps.googleusercontent.com",
        "client_secret": "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",
        "redirect_uris": ["https://localhost:3443"],
      }
    }

    return new Promise((resolve) => {
      this.getAuthClient(credentials).then((oAuth2Client: any) => {
        this.getToken(oAuth2Client).then((auth) => {
          console.log('認証完了');
          resolve(auth);
        })
      });
    });
  }

  /**
   * OAuth認証処理
   * given callback function.
   * @param {Object} credentials 認証データ
   * @return (promise) object oAuth2Client.
   */
  async getAuthClient(credentials: Credentials): Promise<object> {
    const {client_secret, client_id, redirect_uris} = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    return oAuth2Client;
    // new Promise((resolve) => {
    //   console.log('アクセストークンの取得開始(初回)');
    //   this.getToken(oAuth2Client).then(() => {
    //     console.log('アクセストークンの取得完了(初回)');
    //     resolve(oAuth2Client);
    //   })
    // });
  }

  getToken(oAuth2Client: any): Promise<object> {
    // 指定されたコードのアクセストークンを取得
    return new Promise((resolve) => {
      oAuth2Client.getToken(this.accessCode, (err: any, token: any) => {
        if (err) {
          console.error('アクセストークンを発行できませんでした', err);
          return;
        }
        oAuth2Client.setCredentials(token);
        console.log(oAuth2Client);
        resolve(oAuth2Client);
      });
    });
  }
}