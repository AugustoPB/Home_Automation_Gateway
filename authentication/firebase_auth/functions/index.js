const functions = require('firebase-functions')
const admin = require('firebase-admin')

var serviceAccount = require("./keys/fir-auth-hands-on-firebase-adminsdk-upob8-696b12921d.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://fir-auth-hands-on.firebaseio.com"
})

exports.auth = functions.https.onRequest((req, res) => {
    if (req.method === 'GET') {
        // Create URL to login page: https://<projectId>.web.app?<params>
        const redirectURL = require('url').format({
            host: `https://${serviceAccount.project_id}.web.app`,
            query: req.query
        })
        // Redirect to login page
        return res.redirect(redirectURL)

    }
    else if (request.method === 'POST') {

    }
    else {
        // Unsupported method
        response.send(405, 'Method Not Allowed')
    }
})

