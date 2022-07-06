## 概要

- nodeとexpressを使ったサンプルアプリ
- google calendar apiのお試し (OAuth2.0)
- cloud SQLのお試し

## 環境構築

### firestoreの準備

1. 新しいプロジェクトを作成し、firestoreを構築する
2. nodejs用のcredentials.jsonをダウンロード
3. node/src/lib/firestore-credentials.jsonを作成し内容をコピペ

### OAuth Clientの準備

1. GCPコンソール画面からOAuth Clientの作成。REDIRECT_URIに`https://localhost:3443/`を登録すること。
2. 作成したClientの情報をもとに、CLIENT_ID、CLIENT_SECRET、REDIRECT_URIを記載 (.env.example参考)

### docker構築

1. 以下のChromeの設定画面を開き、`Allow invalid certificates for resources loaded from localhost.` をEnabledに変更して保存する
> chrome://flags/#allow-insecure-localhost

2. `make init`を実行

3. `make up`と`make start`を実行

4. https化してあるlocalhostを開く。
> https://localhost:3443/

5. `/generate-new-key`を実行して、返ってくるkeyを.envのENCRYPTION_KEYに記載する

### 実装内容

- `/` : 認可コード発行用ページ。ここからgoogleアカウント選択画面に遷移し、認可コードを発行する

- `/google-start` : 上記で返される認可コード(URLのcode=の部分)、store_id、seat_idをリクエストに入れて送るとfirestoreにトークン情報が保存されるAPI

- `/google-create` : 指定したstore_id、seat_idのカレンダーに適当なスケジュールを登録するAPI

- `/google-get` : 指定したstore_id、seat_idのカレンダー情報を取得するAPI

- `/generate-new-key` : 暗号化・復号化用のキーを生成するAPI

