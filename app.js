const express = require('express')
let ejs = require('ejs');
const mongoose = require('mongoose');
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const saltRounds = 10;
var passwordValidator = require('password-validator');
var session = require('express-session')


const app = express()


//middle ware
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000
    },
    // maxAge : 3600000000,
  }))

// var hour = 3600000
// req.session.cookie.expires = new Date(Date.now() + hour)
// req.session.cookie.maxAge = hour

//db connnection
mongoose.connect('mongodb://127.0.0.1:27017/qnanode')
  .then(() => console.log('Connected!'));



//password validator

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(2)  

//db schema
const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    user : String,
    password : String,
    img : String,
    bio : String,
    

})

const User = mongoose.model('User',userSchema)

//route
app.get('/', function (req, res) {
    if(req.session.user !== undefined){
        data = {
            'session' : req.session.user,
            "loged_in" : true
        }
        res.render('index',data);
    }
    else{
        data = {
            'session' : req.session.user,
            "loged_in" : false
        }
        res.render('index',data);
    }
})
app.get('/ask', function (req, res) {
    if(req.session.user !== undefined){
        data = {
            'session' : req.session.user,
            "loged_in" : true
        }
        res.render('ask',data);
    }
    else{
        res.redirect("/login")
    }
})
app.get('/answer', function (req, res) {
    res.render('answer');
})
app.get('/signup', function (req, res) {
    res.render('register');
})
app.post('/signup', function (req, res) {
    User.find({email : req.body.email}).then(user=>{
        if(user.length > 0){
            console.log("user available")
        }
        else{
            User.find({user : req.body.username}).then(user_user=>{
                if(user_user.length > 0){
                    console.log("user available")

                }
                else{
                    if(schema.validate(req.body.password)){
                        bcrypt.genSalt(saltRounds, function(err, salt) {
                            bcrypt.hash(req.body.password, salt, function(err, hash) {
                                const u = new User({
                                    email : req.body.email,
                                    username : req.body.username,
                                    name : req.body.fullname,
                                    password : hash,
                                    bio : 'Hi'
                                })
                                u.save()
                                res.redirect("/login")
                            });
                        });
                    }
                    else{
                        console.log("not validated")
                    }
                }
            }).catch(
                console.log("undefined 2")

            )
        }
    }).catch(
        console.log("undefined 1")
    )
})
app.get('/login', function (req, res) {
    res.render('login');
})
app.get('/logout', function (req, res) {
    req.session.destroy(function(err) {
        res.redirect("/")
      })
})
app.post('/login', function (req, res) {
    console.log(req.body.email)
    User.find({email : req.body.email}).then(user=>{
        if(user.length == 1){
            bcrypt.compare(req.body.password, user[0].password, function(err, result) {
               if(result){
                console.log('login')
                req.session.user = user[0].email
                res.redirect("/")
               }
               else{
                console.log("password wrong")
               }
            });
        }
        else{
            console.log("Not availabe")
        }
    }
    ).catch(
        console.log("undefined login")
    )
})

app.listen(3000)

