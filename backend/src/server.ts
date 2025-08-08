import express from 'express'
import cors from 'cors'
import { logger } from './lib/logger'
import { env, isProduction } from './lib/env'
import { onShutdown } from './lib/shutdown'
import { performHealthCheck, startHealthCheckSchedule } from './lib/health'
import apiRoutes from './api/routes'
import { startWeeklySync } from './jobs/weekly-sync'
import { metrics } from './lib/metrics'

async function startServer() {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Request logging
  app.use((req, res, next) => {
    const start = process.hrtime.bigint()
    logger.info(`${req.method} ${req.path}`, { 
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    res.on('finish', () => {
      const end = process.hrtime.bigint()
      const ms = Number(end - start) / 1_000_000
      metrics.recordRequest(req.method, req.path, res.statusCode, ms)
    })
    next()
  })

  // API routes
  app.use('/api', apiRoutes)

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Simple Project API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date()
    })
  })

  // Error handler
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('API Error', { error: error.message, path: req.path })
    try { metrics.recordError(error, req.path, 500) } catch {}
    res.status(500).json({ error: 'Internal server error' })
  })

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' })
  })

  // Health check
  const healthStatus = await performHealthCheck()
  if (healthStatus.status === 'unhealthy') {
    logger.error('System health check failed, exiting', { healthStatus })
    process.exit(1)
  }

  // Start health monitoring and weekly sync in production
  if (isProduction()) {
    startHealthCheckSchedule()
    startWeeklySync()
  }

  // Setup shutdown handlers
  onShutdown(async () => {
    logger.info('Shutting down API server...')
    server.close()
  })

  // Start server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API Server running on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      port: env.PORT
    })
  })

  return server
}

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server', { error })
    process.exit(1)
  })
}

export default startServer
