const express = require('express')
let ejs = require('ejs');

const app = express()


//middle ware
app.use(express.static('public'))
app.set('view engine', 'ejs');


app.get('/', function (req, res) {
    res.render('index');
})
app.get('/ask', function (req, res) {
    res.render('ask');
})
app.get('/answer', function (req, res) {
    res.render('answer');
})
app.get('/signup', function (req, res) {
    res.render('register');
})
app.get('/login', function (req, res) {
    res.render('login');
})

app.listen(3000)

