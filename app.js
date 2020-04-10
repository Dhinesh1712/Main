const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const dbConnection = require('./db/dbConnect')
const app = express()
const port = 9000

const router = require('./routes/index')
app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/static'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload({
  createParentPath: true
}))

app.use('/', router)

dbConnection.on('connected', () => {
  app.listen(port)
  console.log(`Server running successfully at ${port}`)
})