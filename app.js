const express = require('express')
const fs = require('fs').promises
const rateLimit = require('express-rate-limit')
const path = require('path')
const axios = require('axios')
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.File({
      filename: 'app.log',
      maxsize: 1024 * 1024 * 5,
      maxFiles: 3
    }),
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console()]
      : [])
  ]
})

['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
  const original = console[method]
  console[method] = (...args) => {
    logger[method](args.join(' '))
    if (process.env.NODE_ENV === 'development') {
      original.apply(console, args)
    }
  }
})

if (!global.handledGlobalError) {
  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack })
    process.exit(1)
  })
  
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`)
    process.exit(1)
  })
  
  global.handledGlobalError = true
}

const app = express()
const port = process.env.PORT || 3000

const PUBLIC_DIR = path.join(__dirname, 'public')
const VIEWS_DIR = path.join(__dirname, 'views')
const ENDPOINTS_FILE = path.join(__dirname, 'list.json')
const API_DIR = path.join(__dirname, 'API')

let endpoints = []
let uniqueTagsFromData = []

app.use(express.json({ 
  limit: '50kb',
  strict: true 
}))

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50kb',
  parameterLimit: 20 
}))

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Terlalu banyak permintaan, coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.ip === '::ffff:127.0.0.1'
})

app.set('trust proxy', 1)
app.use(apiLimiter)
app.set('json spaces', 2)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  next()
})

app.use((req, res, next) => {
  res.successJson = (data, statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      data
    })
  }
  
  res.errorJson = (message, statusCode = 500) => {
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
      message = 'Internal server error'
    }
    
    res.status(statusCode).json({
      success: false,
      error: message
    })
  }
  
  next()
})

app.use(express.static(PUBLIC_DIR, {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  }
}))

app.set('view engine', 'ejs')
app.set('views', VIEWS_DIR)

async function getAllJsFiles(dirPath) {
  const results = []
  const stack = [dirPath]
  
  while (stack.length) {
    const currentPath = stack.pop()
    try {
      const files = await fs.readdir(currentPath, { withFileTypes: true })
      
      for (const file of files) {
        const fullPath = path.join(currentPath, file.name)
        
        if (file.isDirectory()) {
          stack.push(fullPath)
        } else if (
          file.isFile() && 
          path.extname(file.name) === '.js' &&
          file.name !== 'index.js'
        ) {
          results.push(fullPath)
        }
      }
    } catch (err) {
      logger.warn(`Directory read error: ${currentPath} - ${err.message}`)
    }
  }
  
  return results
}

let lastPing = 0
const counterMiddleware = (req, res, next) => {
  const now = Date.now()
  
  if (now - (lastPing || 0) > 2000) {
    lastPing = now
    axios.get('https://copper-ambiguous-velvet.glitch.me/up', { 
      timeout: 2000 
    })
    .catch(err => {
      logger.warn(`Counter ping failed: ${err.message}`)
    })
  }
  
  next()
}

async function initializeServer() {
  try {
    const rawData = await fs.readFile(ENDPOINTS_FILE, 'utf-8')
    const dataJson = JSON.parse(rawData)
    endpoints = dataJson.fitur || []
    uniqueTagsFromData = [...new Set(
      endpoints.flatMap(ep => ep.tags || [])
    )].sort()
  } catch (err) {
    logger.error(`Failed to read endpoints: ${err.message}`)
  }

  try {
    const jsFiles = await getAllJsFiles(API_DIR)
    const mountedRoutes = new Set()
    
    for (const filePath of jsFiles) {
      try {
        const { default: handler } = await import(filePath)
        const endpointName = path.parse(filePath).name
        const routePath = `/api/v1/${endpointName}`
        
        if (!mountedRoutes.has(routePath)) {
          app.use(routePath, counterMiddleware, handler)
          mountedRoutes.add(routePath)
          logger.info(`Mounted route: ${routePath}`)
        }
      } catch (err) {
        logger.warn(`Failed to load ${filePath}: ${err.message}`)
      }
    }
  } catch (err) {
    logger.error(`API loading failed: ${err.message}`)
  }

  const filterCache = new Map()
  function filterEndpoints(params = {}) {
    const cacheKey = JSON.stringify(params)
    
    if (filterCache.has(cacheKey)) {
      return filterCache.get(cacheKey)
    }
    
    let filtered = [...endpoints]
    
    if (params.tags) {
      const tagList = new Set(
        params.tags.toLowerCase().split(',').map(t => t.trim())
      )
      
      filtered = filtered.filter(ep => 
        ep.tags?.some(tag => tagList.has(tag.toLowerCase()))
      )
    }
    
    if (params.term) {
      const termLC = params.term.toLowerCase()
      filtered = filtered.filter(ep =>
        ep.nama?.toLowerCase().includes(termLC) ||
        ep.endpoint?.toLowerCase().includes(termLC) ||
        ep.deskripsi?.toLowerCase().includes(termLC) ||
        ep.tags?.some(tag => tag.toLowerCase().includes(termLC))
      )
    }
    
    filterCache.set(cacheKey, filtered)
    setTimeout(() => filterCache.delete(cacheKey), 300000)
    return filtered
  }

  app.get('/', (req, res) => {
    res.render('index', {
      endpoints,
      uniqueTags: uniqueTagsFromData
    })
  })

  app.get('/tags', (req, res) => {
    res.json({ tags: uniqueTagsFromData })
  })

  app.get('/renderpage', (req, res) => {
    res.json({ endpoints: filterEndpoints({ tags: req.query.tags }) })
  })

  app.get('/search', (req, res) => {
    res.json({ endpoints: filterEndpoints({ term: req.query.term }) })
  })

  app.use((req, res) => {
    res.status(404)
    
    if (req.accepts('html')) {
      res.render('404')
    } else {
      res.errorJson('Sumber daya tidak ditemukan', 404)
    }
  })

  app.use((err, req, res, next) => {
    logger.error(`Request error: ${err.message}`, {
      url: req.originalUrl,
      stack: err.stack
    })
    
    if (!res.headersSent) {
      res.errorJson(err.message, err.status || 500)
    }
  })

  const server = app.listen(port, () => {
    logger.info(`Server running on port ${port}`)
    
    if (process.env.MONITOR_MEMORY) {
      setInterval(() => {
        const used = process.memoryUsage()
        logger.debug('Memory usage:', {
          rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(used.external / 1024 / 1024)}MB`
        })
      }, 60000)
    }
  })

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`)
    
    try {
      await new Promise((resolve) => server.close(resolve))
      logger.info('HTTP server closed')
      process.exit(0)
    } catch (err) {
      logger.error('Shutdown error:', err)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

initializeServer().catch(err => {
  logger.error('Server initialization failed:', err)
  process.exit(1)
})