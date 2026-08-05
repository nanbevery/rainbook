import { createServer } from 'node:http'
import { parse } from 'node:url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

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

const socketModule = dev
  ? await import('./src/lib/socket.ts')
  : await import('./.next/standalone/src/lib/socket.js')

socketModule.initSocketServer(server)

server.listen(port, () => {
  console.log(`> Server ready on http://${hostname}:${port}`)
  console.log(`> WebSocket enabled`)
})
