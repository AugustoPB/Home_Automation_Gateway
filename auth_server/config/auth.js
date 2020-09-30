require('dotenv').config({ path: './config/.env' })
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
module.exports = {
    ensureAuthorizedClientRequest: function (req, res, next) {
        const {client_id, redirect_uri, response_type} = req.query

        // Check if it is a request from an authorized client
        if (client_id != process.env.SERVICE_CLIENT_ID) return res.redirect('/error')
        if (redirect_uri != process.env.GOOGLE_ACTIONS_REDIRECT_URI) return res.redirect('/error')
        if (response_type != 'code') return res.redirect('/error')
        
        return next()
    },

    getUserFromToken: async function (idtoken) {
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
        const authToken = jwt.sign({userId: user._id}, process.env.AUTHORIZATION_TOKEN_SECRET, { expiresIn: '10m' })
        const url = new URL(redirectParams.redirect_uri)
        url.search = `?code=${authToken}&state=${redirectParams.state}`
        return url
    },

    generateAccessToken: function (user){
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' })
    }
}