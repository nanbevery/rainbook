const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initSocketServer } = require('./.next/standalone/src/lib/socket')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  initSocketServer(server)

  server.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`)
  })
})
