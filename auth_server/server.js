require('dotenv').config({ path: './config/.env' })
const express = require('express')
const jwt = require('jsonwebtoken')

const { validateClientRequestForAuth, validateClientRequestForToken, getUserFromToken, generateAuthURL } = require('./config/auth')


const app = express()

// Connect to MongoDB
const { userDB, tokenDB } = require('./config/mongoose')
const User = require('./models/User')(userDB)
const RefreshToken = require('./models/RefreshToken')(tokenDB)

// Setup ejs
app.set('view engine', 'ejs')

// Body Parser
app.use(express.urlencoded({ extended: false }))

// Route to authorization page
app.get('/login', validateClientRequestForAuth, (req, res) => {
    console.log(req.query.client_id)
    res.render('login')
})

app.get('/auth', (req, res) => {
    if (!req.query.responseurl) return res.redirect('/error')
    res.render('auth')
})
app.post('/auth', (req, res) => {
    if (!req.query.responseurl) return res.redirect('/error')
    console.log(`Redirecting to: ${req.query.responseurl}`)
    res.redirect(decodeURIComponent(req.query.responseurl))
})

// Google login POST route
app.post('/auth/google', validateClientRequestForAuth, (req, res) => {
    const { idtoken } = req.body
    console.log('Authenticating...')

    getUserFromToken(idtoken)
        .then(user => {
            const { sub, name, email, picture } = user
            // Check if user is registered
            User.findOne({ sub: sub })
                .then(user => {
                    if (user) {
                        console.log(`User: ${user}`)
                        // User exists
                        // Generete URL with authorization token and redirect to authorize
                        return res.redirect(`/auth?responseurl=${encodeURIComponent(generateAuthURL(user, req.query))}`)
                    }
                    else {
                        // User do not exists. Register new user to data base
                        const newUser = new User({
                            sub,
                            name,
                            email,
                            picture
                        })
                        console.log(`NewUser: ${newUser}`)
                        newUser.save()
                        // Generete authorization token and redirect to authorize
                        return res.redirect(`/auth?responseurl=${encodeURIComponent(generateAuthURL(newUser, req.query))}`)
                    }
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
})

app.post('/token', validateClientRequestForToken, (req, res) => {
    const { client_id, grant_type, redirect_uri, code } = req.query

    if (grant_type == 'authorization_code') {
        jwt.verify(code, process.env.AUTHORIZATION_TOKEN_SECRET, (err, authCredentials) => {
            if (err) return res.sendStatus(403) // change this

            // Verify authorization credentials
            if (authCredentials.clientId != client_id) return res.sendStatus(403) // change this
            if (authCredentials.redirectUri != redirect_uri) return res.sendStatus(403) // change this

            const tokenCredentials = {
                userId: authCredentials.userId,
                clientId: authCredentials.clientId,
            }
            // Create access token
            const accessToken = jwt.sign(tokenCredentials, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            // Create refresh token
            const refreshToken = jwt.sign(tokenCredentials, process.env.REFRESH_TOKEN_SECRET)

            // Save RefreshToken to DB
            const newRToken = new RefreshToken({
                userId: tokenCredentials.userId,
                token: refreshToken
            })
            console.log(newRToken)
            newRToken.save()

            // Responds request with access token and refreshToken
            return res.json({
                token_type: "Bearer",
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 60 * 60 // One Hour
            })
        })
    }
    else {
        jwt.verify(code, process.env.REFRESH_TOKEN_SECRET, (err, tokenCredentials) => {
            if (err) return res.sendStatus(403) // change this
            // Verify token credentials
            if (tokenCredentials.clientId != client_id) return res.sendStatus(403) // change this
            // Verify if user exists
            User.findById(tokenCredentials.userId)
                .then(user => {
                    if (user) {
                        // Create access token
                        const accessToken = jwt.sign(tokenCredentials, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                        // Responds request with access token and refreshToken
                        return res.json({
                            token_type: "Bearer",
                            access_token: accessToken,
                            expires_in: 60 * 60 // One Hour
                        })
                    }
                    else {
                        return res.sendStatus(403) // change this
                    }
                })
                .catch(err => console.log(err))
        })
    }
})


app.post('/fulfillment', (req, res) => {
    console.log(req)
    res.sendStatus(200)
})

//app.get('/success', (req, res) => res.send(req.user));
app.get('/error', (req, res) => res.render('error'))

// Starts listening
const port = process.env.PORT || 5000;
app.listen(port, () => console.log('App listening on port ' + port));