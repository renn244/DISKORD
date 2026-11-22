import express from 'express'
import { ensureAuthenticated } from '../utils/ensureAuthenticated.js'
import handleError from '../utils/handleserverError.js'
import { pool } from '../DB/db.js'
import { io, getReceiverSocketId } from '../socket/socket.js'

const router = express.Router()

// tells both users to refetch their friends list
const notifyFriendsUpdated = (...userIds) => {
    userIds.forEach(id => {
        const socketId = getReceiverSocketId(id.toString())
        if(socketId) io.to(socketId).emit('friendsUpdated')
    })
}

// everyone you have a relationship with. the frontend splits it into Online, All, Pending and Blocked
router.get('/list', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id

        const getFriends = await pool.query(`
            SELECT u.id, u.name, u.username,
            COALESCE(ui.usericons, '') AS usericons,
            f.status,
            CASE WHEN f.requester_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction
            FROM friendships f
            JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
            LEFT JOIN userinfo ui ON ui.user_id = u.id
            WHERE (f.requester_id = $1 OR f.addressee_id = $1)
            AND NOT (f.status = 'blocked' AND f.addressee_id = $1)
            ORDER BY LOWER(u.name);
        `, [userId])

        res.status(200).json(getFriends.rows)
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/friend/list")
    }
})

router.post('/request', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const username = req.body.username?.trim()

        if(!username) return handleError(res, "Please type a username", 400)

        const findUser = await pool.query(`
            SELECT id FROM users WHERE username = $1 LIMIT 1;
        `, [username])
        const friendId = findUser.rows[0]?.id

        if(!friendId) return handleError(res, "Hm, didn't work. Double check that the username is correct.", 404)
        if(friendId === userId) return handleError(res, "You can't add yourself as a friend", 400)

        const findFriendship = await pool.query(`
            SELECT requester_id, status FROM friendships
            WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1);
        `, [userId, friendId])
        const sentByMe = findFriendship.rows.find(row => row.requester_id === userId)
        const sentByThem = findFriendship.rows.find(row => row.requester_id === friendId)

        // being blocked looks the same as a wrong username so they can't tell
        if(sentByThem?.status === 'blocked') return handleError(res, "Hm, didn't work. Double check that the username is correct.", 404)
        if(sentByMe?.status === 'blocked') return handleError(res, "You blocked this user. Unblock them first.", 400)
        if(sentByMe?.status === 'accepted' || sentByThem?.status === 'accepted') return handleError(res, "You're already friends with this user", 400)
        if(sentByMe?.status === 'pending') return handleError(res, "You already sent this user a friend request", 400)

        // they already asked you so just accept it
        if(sentByThem?.status === 'pending') {
            await pool.query(`
                UPDATE friendships SET status = 'accepted'
                WHERE requester_id = $1 AND addressee_id = $2;
            `, [friendId, userId])

            notifyFriendsUpdated(userId, friendId)
            return res.status(200).json({ message: `You are now friends with ${username}` })
        }

        await pool.query(`
            INSERT INTO friendships (requester_id, addressee_id, status)
            VALUES ($1, $2, 'pending');
        `, [userId, friendId])

        notifyFriendsUpdated(userId, friendId)
        res.status(200).json({ message: `Success! Your friend request to ${username} was sent.` })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/friend/request")
    }
})

router.post('/accept/:friendId', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)

        const acceptRequest = await pool.query(`
            UPDATE friendships SET status = 'accepted'
            WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending'
            RETURNING requester_id;
        `, [friendId, userId])

        if(!acceptRequest.rows[0]) return handleError(res, "That friend request doesn't exist anymore", 404)

        notifyFriendsUpdated(userId, friendId)
        res.status(200).json({ message: "Friend request accepted" })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/friend/accept/:friendId")
    }
})

// used for declining, cancelling a request you sent and removing a friend
router.post('/remove/:friendId', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)

        const removeFriend = await pool.query(`
            DELETE FROM friendships
            WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
            AND status IN ('pending', 'accepted')
            RETURNING status;
        `, [userId, friendId])

        if(!removeFriend.rows[0]) return handleError(res, "You are not friends with this user", 404)

        notifyFriendsUpdated(userId, friendId)
        res.status(200).json({ message: "Removed" })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/friend/remove/:friendId")
    }
})

router.post('/block/:friendId', ensureAuthenticated, async (req, res) => {
    const client = await pool.connect()
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)

        if(!Number.isInteger(friendId) || friendId === userId) return handleError(res, "You can't block this user", 400)

        const findUser = await client.query(`SELECT id FROM users WHERE id = $1;`, [friendId])
        if(!findUser.rows[0]) return handleError(res, "User does not exist", 404)

        await client.query('BEGIN')

        // blocking ends the friendship or request, but keeps their block if they blocked you too
        await client.query(`
            DELETE FROM friendships
            WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
            AND NOT (requester_id = $2 AND status = 'blocked');
        `, [userId, friendId])

        await client.query(`
            INSERT INTO friendships (requester_id, addressee_id, status)
            VALUES ($1, $2, 'blocked');
        `, [userId, friendId])

        await client.query('COMMIT')

        notifyFriendsUpdated(userId, friendId)
        res.status(200).json({ message: "Blocked" })
    } catch (error) {
        console.log(error)
        await client.query('ROLLBACK')
        handleError(res, "", 500, "/friend/block/:friendId")
    } finally {
        client.release()
    }
})

router.post('/unblock/:friendId', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id
        const friendId = Number(req.params.friendId)

        const unblock = await pool.query(`
            DELETE FROM friendships
            WHERE requester_id = $1 AND addressee_id = $2 AND status = 'blocked'
            RETURNING status;
        `, [userId, friendId])

        if(!unblock.rows[0]) return handleError(res, "This user is not blocked", 404)

        notifyFriendsUpdated(userId, friendId)
        res.status(200).json({ message: "Unblocked" })
    } catch (error) {
        console.log(error)
        handleError(res, "", 500, "/friend/unblock/:friendId")
    }
})

export default router
