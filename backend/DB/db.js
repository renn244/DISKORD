import pg from 'pg'
import 'dotenv/config'

// we need to import main pg and just get the Pool from pg using objects getting something(i don't know what's its called)
const { Pool } = pg

/*
 then just initialiaze the pool 
 the connection info is in the .env (see .env.example)
*/
export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
})
