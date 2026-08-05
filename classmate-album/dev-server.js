const { createServer } = require('http')
const { spawn } = require('child_process')

const port = parseInt(process.env.PORT || '3000', 10)

const server = createServer((req, res) => {
  // Proxy all requests to next dev server on port 3001 internally
  const proxyReq = require('http').request(
    { hostname: '127.0.0.1', port: 3001, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )
  req.pipe(proxyReq)
  proxyReq.on('error', () => {
    res.writeHead(502)
    res.end('Bad Gateway')
  })
})

const { initSocketServer } = require('./src/lib/socket')
initSocketServer(server)

server.listen(port, () => {
  console.log(`> WebSocket server ready on http://0.0.0.0:${port}`)

  // Start next dev on internal port 3001
  const nextDev = spawn('npx', ['next', 'dev', '-p', '3001'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' },
  })

  nextDev.on('close', (code) => {
    console.log(`Next.js dev process exited with code ${code}`)
    process.exit(code)
  })
})
