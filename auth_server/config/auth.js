require('dotenv').config({ path: './config/.env' })
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library');

module.exports = {
    validateClientRequestForAuth: function (req, res, next) {
        const {client_id, redirect_uri, response_type} = req.query

        // Check if it is a request from an authorized client
        if (client_id != process.env.SERVICE_CLIENT_ID) return res.redirect('/error')
        if (redirect_uri != process.env.GOOGLE_ACTIONS_REDIRECT_URI) return res.redirect('/error')
        if (response_type != 'code') return res.redirect('/error')
        
        return next()
    },
    validateClientRequestForToken: function (req, res, next) {
        const {client_id, client_secret, redirect_uri, grant_type} = req.query

        // Check if it is a request from an authorized client
        if (client_id != process.env.SERVICE_CLIENT_ID) return res.redirect('/error')
        if (client_secret != process.env.SERVICE_CLIENT_SECRET) return res.redirect('/error')
        if (grant_type != 'authorization_code' || grant_type != 'refresh_token') return res.redirect('/error')
        
        return next()
    },

    getUserFromToken: async function (idtoken) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: idtoken,
            audience: process.env.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const user = ticket.getPayload()
        return user
    },

    generateAuthURL: function (user, redirectParams) {
        // Create authorization token
        const authCredentials = {
            userId: user._id,
            clientId: redirectParams.client_id,
            redirectUri: redirectParams.redirect_uri
        }
        const authToken = jwt.sign(authCredentials, process.env.AUTHORIZATION_TOKEN_SECRET, { expiresIn: '10m' })
        // Create response url with auth token and state
        const url = new URL(redirectParams.redirect_uri)
        url.search = `?code=${authToken}&state=${redirectParams.state}`
        return url
    }

}