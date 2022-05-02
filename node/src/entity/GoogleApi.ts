export type Config = {
  scopes: [string],
  tokenPath: string,
  auth?: unknown,
}

export type Credentials = {
  [key:string]: {
    client_id: string,
    project_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret: string,
    redirect_uris: [string],
    javascript_origins:[string]
  }
}