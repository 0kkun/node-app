import express from 'express'
import GoogleApis from 'googleapis'
require('dotenv').config()

const env = process.env
const PORT = env.NODE_PORT
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.render('hello.ejs')
})

app.get('/api/v1/google_test', (req, res) => {
  res.json({status:200, data:'OK'})
})



app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`)
});