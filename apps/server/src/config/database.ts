import { SQL } from 'bun'
import { drizzle } from 'drizzle-orm/bun-sql'
import * as schema from '../database/schema'
import { config } from './index'

const sql = new SQL(config.databaseUrl)

export const db = drizzle(sql, { schema })

export type Db = typeof db
