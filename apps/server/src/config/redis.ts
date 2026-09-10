import { RedisClient } from 'bun'
import { config } from './index'

export const redis = new RedisClient(config.redisUrl, {
  autoReconnect: true,
  maxRetries: 10
})
