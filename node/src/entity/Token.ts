// Cloud Sql上のテーブルの型情報

export type Token = {
  RowDataPacket: {
    id: number,
    refresh_token: string,
    access_token: string,
    expier_date: string
  }
}