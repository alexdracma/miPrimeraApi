// Create express app
const express = require('express')
const app = express()
const db = require('./database.js')
const md5 = require('md5')
const fs = require('fs')

const cors = require('cors')
app.use(cors({
  origin: '*'
}))

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const https = require('https')
const options = {
  key: fs.readFileSync('./src/server/ssl/key.pem'),
  cert: fs.readFileSync('./src/server/ssl/cert.pem')
}

const HTTPS_PORT = 4334
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log('Server running on port %PORT%'.replace('%PORT%', HTTPS_PORT))
})

// Root endpoint
app.get('/', (req, res, next) => {
  res.json({ message: 'Ok' })
})

// Insert here other API endpoints
app.get('/api/users', (req, res, next) => {
  const sql = 'select * from user'
  const params = []
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message })
      return
    }
    res.json({
      message: 'success',
      data: rows
    })
  })
})

app.get('/api/user/:id', (req, res, next) => {
  const sql = 'select * from user where id = ?'
  const params = [req.params.id]
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message })
      return
    }
    res.json({
      message: 'success',
      data: row
    })
  })
})

app.post('/api/user/', (req, res, next) => {
  const errors = []
  if (!req.body.password) {
    errors.push('No password specified')
  }
  if (!req.body.email) {
    errors.push('No email specified')
  }
  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: md5(req.body.password)
  }
  const sql = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
  const params = [data.name, data.email, data.password]
  db.run(sql, params, function (err, result) {
    if (err) {
      res.status(400).json({ error: err.message })
      return
    }
    res.json({
      message: 'success',
      data,
      id: this.lastID
    })
  })
})

app.patch('/api/user/:id', (req, res, next) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password ? md5(req.body.password) : null
  }
  db.run(
        `UPDATE user set 
           name = COALESCE(?,name), 
           email = COALESCE(?,email), 
           password = COALESCE(?,password) 
           WHERE id = ?`,
        [data.name, data.email, data.password, req.params.id],
        function (err, result) {
          if (err) {
            res.status(400).json({ error: res.message })
            return
          }
          res.json({
            message: 'success',
            data,
            changes: this.changes
          })
        })
})

app.delete('/api/user/:id', (req, res, next) => {
  db.run(
    'DELETE FROM user WHERE id = ?',
    req.params.id,
    function (err, result) {
      if (err) {
        res.status(400).json({ error: res.message })
        return
      }
      res.json({ message: 'deleted', changes: this.changes })
    })
})

// login endpoints

app.post('/api/login/', (req, res, next) => {
  const errors = []
  if (!req.body.email) {
    errors.push('No has especificado un email')
  }
  if (!req.body.password) {
    errors.push('No has especificado una contraseña')
  }

  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }

  const data = {
    email: req.body.email,
    password: req.body.password
  }
  const sql = 'SELECT email, password FROM user WHERE email = ? AND password = ?'
  const params = [data.email, md5(data.password)]

  db.get(sql, params, (err, user) => {
    if (err) {
      res.status(400).json({ error: err.message })
      return
    }
    if (user) {
      res.json({
        message: 'success',
        data: user
      })
    } else {
      res.json({
        message: '¡Contraseña incorrecta!',
        params
      })
    }
  })
})

// Default response for any other request
app.use(function (req, res) {
  res.status(404)
})
