require('dotenv').config({ path: './config/.env' })
const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const { ensureAuthorizedClientRequest, getUserFromToken, generateAuthURL } = require('./config/auth')
const User = require('./models/User')

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err))

// Setup ejs
app.set('view engine', 'ejs');

// Body Parser
app.use(express.urlencoded({ extended: false }))

// Route to authorization page
app.get('/login', ensureAuthorizedClientRequest, (req, res) => {
    console.log(req.query.client_id)
    res.render('login');
});

app.get('/auth', (req, res) => {
    if (!req.query.responseurl) return res.redirect('/error')

    console.log(`Redirecting to: ${req.query.responseurl}`)
    res.redirect(decodeURIComponent(req.query.responseurl))
});

// Google login POST route
app.post('/auth/google', ensureAuthorizedClientRequest, (req, res) => {
    console.log(req.query)
    const { idtoken } = req.body

    getUserFromToken(idtoken)
        .then(user => {
            const { sub, name, email, picture } = user
            // Check if user is registered
            User.findOne({ sub: sub })
                .then(user => {
                    if (user) {
                        console.log(user)
                        // User exists
                        // TODO generete authorization token and redirect to actions on google url
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
                        console.log(newUser)
                        newUser.save()
                        // TODO generete authorization token and redirect to actions on google url
                        return res.redirect(302,generateAuthURL(newUser, req.query))
                    }
                })
                .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
})

app.post('/token', (req, res) => {
    console.log(req.body)
    res.sendStatus(200)
})
app.get('/token', (req, res) => {
    console.log(req.body)
    res.sendStatus(200)
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