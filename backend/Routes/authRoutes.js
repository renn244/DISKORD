import express from 'express'
import passport from 'passport'
import handleError from '../utils/handleserverError.js'
import { pool } from '../DB/db.js'
import bcrypt from 'bcrypt'

const router = express.Router()


// Google Auth
router.get('/google',
    passport.authenticate('google', { scope: ['profile']}))

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: process.env.CLIENT_BASE_URL + '/' }),
    function(req, res) {
        res.redirect(process.env.CLIENT_BASE_URL)
    }
)

// local authentication
router.post('/login',
    passport.authenticate('local', 
        { failureRedirect: process.env.CLIENT_BASE_URL + '/login' }),
    function(req, res) {
        res.status(200).json({ user: {
            auth_type: req.user.auth_type,
            name: req.user.name,
            id: req.user.id
            }
        })
    }
)

router.post('/signup', async (req, res) => {
    try {
        const { password } = req.body
        const username = req.body.username?.trim()

        if(!username || !password) return handleError(res, "Please fill in all the fields", 400)
        if(username.length > 40) return handleError(res, "Username must be 40 characters or less", 400)

        // usernames have to be unique, friends are added by username
        const usernameTaken = await pool.query(`
            SELECT 1 FROM users WHERE username = $1;
        `, [username])
        if(usernameTaken.rows[0]) return handleError(res, "That username is already taken", 400)
        const encryptedpassword =  bcrypt.hashSync(password, 10);
        const hashpassword = encryptedpassword.trim()

        const createUser = await pool.query(`
            INSERT INTO users (name, username, password, auth_type)
            VALUES ($1, $2, $3, $4);
        `, [username, username, hashpassword, 'Local']) // Local is a enum value you can see in the TableTypes.md

        if (!createUser) return handleError(res, "faield to create user", 400)

        res.status(200).json({message : "Successfully created an account"})
    } catch (error) {
        console.log(error.message)
        handleError(res, '', 500, 'authroutes/signup Controller')
    }
})

// logout for local auth and O auth
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if(err) return next(err)
        res.status(200).json({ message : "Successfully logged out"})
    })
    // This will clear the login session, regardless of the authentication method used
})


// this is responsible for getting the user authenticated and making sure that the user is authenticated
router.get("/check", (req, res) => {
    if(req.isAuthenticated()) {
        // console.log(req.user)
        res.send({ user: {
            auth_type: req.user.auth_type,
            name: req.user.name,
            id: req.user.id,
            usericons: req.user?.usericons || null,
        }})
        // put other things later
    } else { 
        res.send({ user: undefined})
    }
})

export default router