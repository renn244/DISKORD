import express from 'express'
import { ensureAuthenticated } from '../utils/ensureAuthenticated.js'
import handleError from '../utils/handleserverError.js'
import { pool } from '../DB/db.js'
import { io, getReceiverSocketId } from '../socket/socket.js'

const router = express.Router()

router.post("/AddMessage/:channelId", ensureAuthenticated, async (req, res) => {
    try {
        const { channelId } = req.params
        const userId = req.user?.id
        const message = req.body.message?.trim()

        if(!Number.isInteger(Number(channelId))) return handleError(res, "Channel does not exist", 404)
        if(!message) return handleError(res, "Message can't be empty", 400)
        if(message.length > 2000) return handleError(res, "Message is too long (2000 characters max)", 400)

        // only members of the server can send messages in its channels
        const isMember = await pool.query(`
            SELECT 1 FROM channels c
            JOIN server_member sm ON sm.server_id = c.server_id
            WHERE c.id = $1 AND sm.user_id = $2;
        `, [channelId, userId])
        if(!isMember.rows[0]) return handleError(res, "You are not a member of this server", 403)

        const addMessage = await pool.query(`
            INSERT INTO messages (channel_id, user_id, content)
            VALUES ($1, $2, $3) 
            RETURNING *, (SELECT name FROM users WHERE id = $2);
        `, [channelId, userId, message])
        io.to(channelId.toString()).emit('message', addMessage.rows[0])

        res.status(200).json(addMessage.rows[0].id)
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "AddMessage/:channelId")
    }
})

router.post("/GetMessage/:channelId", ensureAuthenticated, async (req, res) => {
    try {
        const { channelId } = req.params
        const userId = req.user?.id
        const page = Number(req.body.page) || 1

        if(!Number.isInteger(Number(channelId))) return handleError(res, "Channel does not exist", 404)

        const isMember = await pool.query(`
            SELECT 1 FROM channels c
            JOIN server_member sm ON sm.server_id = c.server_id
            WHERE c.id = $1 AND sm.user_id = $2;
        `, [channelId, userId])
        if(!isMember.rows[0]) return handleError(res, "You are not a member of this server", 403)

        // should also include user icons later add it
        // newest 50 for that page, then flipped so the oldest is on top
        const getMessages =  await pool.query(`
            SELECT * FROM (
                SELECT m.id, m.channel_id, m.user_id, m.timestamp, m.content,
                s.name
                FROM messages m
                LEFT JOIN users s ON s.id = m.user_id
                WHERE channel_id = $1
                ORDER BY m.timestamp DESC, m.id DESC
                LIMIT 50 OFFSET $2
            ) m
            ORDER BY timestamp ASC, id ASC;
        `, [channelId, (page - 1) * 50])

        res.status(200).json({
            messages: getMessages.rows,
            hasMore: getMessages.rows.length === 50
        })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/GetMessage/channelId")
    }
})

// DIRECT MESSAGES

// everyone you have talked to, latest first (for the Direct Messages sidebar)
router.get("/GetConversations", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id

        const getConversations = await pool.query(`
            SELECT u.id, u.name, COALESCE(ui.usericons, '') AS usericons,
            MAX(dm.timestamp) AS last_message
            FROM direct_messages dm
            JOIN users u ON u.id = CASE WHEN dm.sender_id = $1 THEN dm.receiver_id ELSE dm.sender_id END
            LEFT JOIN userinfo ui ON ui.user_id = u.id
            WHERE dm.sender_id = $1 OR dm.receiver_id = $1
            GROUP BY u.id, u.name, ui.usericons
            ORDER BY last_message DESC;
        `, [userId])

        res.status(200).json(getConversations.rows)
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/GetConversations")
    }
})

router.get("/GetDirectMessage/:friendId", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)
        const page = Number(req.query.page) || 1

        if(!Number.isInteger(friendId)) return handleError(res, "User does not exist", 404)

        const getFriend = await pool.query(`
            SELECT u.id, u.name, u.username, COALESCE(ui.usericons, '') AS usericons,
            EXISTS (
                SELECT 1 FROM friendships
                WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
                AND status = 'accepted'
            ) AS is_friend
            FROM users u
            LEFT JOIN userinfo ui ON ui.user_id = u.id
            WHERE u.id = $2;
        `, [userId, friendId])

        if(!getFriend.rows[0]) return handleError(res, "User does not exist", 404)

        // newest 50 for that page, then flipped so the oldest is on top
        const getMessages = await pool.query(`
            SELECT * FROM (
                SELECT dm.id, dm.sender_id AS user_id, dm.receiver_id, dm.timestamp, dm.content, u.name
                FROM direct_messages dm
                JOIN users u ON u.id = dm.sender_id
                WHERE (dm.sender_id = $1 AND dm.receiver_id = $2) OR (dm.sender_id = $2 AND dm.receiver_id = $1)
                ORDER BY dm.timestamp DESC, dm.id DESC
                LIMIT 50 OFFSET $3
            ) m
            ORDER BY timestamp ASC, id ASC;
        `, [userId, friendId, (page - 1) * 50])

        res.status(200).json({
            friend: getFriend.rows[0],
            messages: getMessages.rows,
            hasMore: getMessages.rows.length === 50
        })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/GetDirectMessage/:friendId")
    }
})

router.post("/AddDirectMessage/:friendId", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)
        const message = req.body.message?.trim()

        if(!message) return handleError(res, "Message can't be empty", 400)
        if(message.length > 2000) return handleError(res, "Message is too long (2000 characters max)", 400)

        // you can only message your friends
        const findFriendship = await pool.query(`
            SELECT 1 FROM friendships
            WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
            AND status = 'accepted';
        `, [userId, friendId])

        if(!findFriendship.rows[0]) return handleError(res, "You can only message your friends", 403)

        const addMessage = await pool.query(`
            INSERT INTO direct_messages (sender_id, receiver_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, sender_id AS user_id, receiver_id, timestamp, content,
            (SELECT name FROM users WHERE id = $1);
        `, [userId, friendId, message])
        const newMessage = addMessage.rows[0]

        // send it live to both so it also shows on the sender's other tab
        const receiverSocketId = getReceiverSocketId(friendId.toString())
        const senderSocketId = getReceiverSocketId(userId.toString())
        if(receiverSocketId) io.to(receiverSocketId).emit('directMessage', newMessage)
        if(senderSocketId) io.to(senderSocketId).emit('directMessage', newMessage)

        res.status(200).json(newMessage)
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/AddDirectMessage/:friendId")
    }
})

export default router