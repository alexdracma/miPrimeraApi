// Create express app
const express = require('express')
const app = express()

// Server port
const HTTP_PORT = 8000
// Start server
app.listen(HTTP_PORT, () => {
  console.log('Server running on port %PORT%'.replace('%PORT%', HTTP_PORT))
})
// Root endpoint
app.get('/', (req, res, next) => {
  res.json({ message: 'Ok' })
})

// Insert here other API endpoints

// Default response for any other request
app.use(function (req, res) {
  res.status(404)
})