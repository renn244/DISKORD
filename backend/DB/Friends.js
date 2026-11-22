import { pool } from './db.js'

const createFriends = async () => {
    try {
        // one row per pair of users. requester_id is who sent the request (or who blocked)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS friendships (
                requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(10) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (requester_id, addressee_id)
            );
        `)

        await pool.query(`
            CREATE TABLE IF NOT EXISTS direct_messages (
                id SERIAL PRIMARY KEY NOT NULL,
                sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `)

        await pool.query(`
            CREATE INDEX IF NOT EXISTS direct_messages_pair
            ON direct_messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), timestamp);
        `)

        console.log("Successfully created the friendships and direct_messages table")
    } catch (error) {
        console.log("Error in creating Friends Table " + error.message)
    }
}

export default createFriends
