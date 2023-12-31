const express = require('express')
let ejs = require('ejs');
const mongoose = require('mongoose');
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const saltRounds = 10;
var passwordValidator = require('password-validator');
var session = require('express-session')


const app = express()


// //middle ware
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
mongoose.connect('mongodb+srv://mohot:mohot@cluster0.izfa076.mongodb.net/?retryWrites=true&w=majority')
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
    img : {
        type : String,
        default : 'default.jpg'
    },
    bio : String,
    

})

const User = mongoose.model('User',userSchema)
const questionSchema = new mongoose.Schema({
    title : String,
    description : String,
    user : {
        type : mongoose.Types.ObjectId,
        ref : 'User'
    },
    category : String,
    time : {
        type : Date,
        default : new Date()

    },

})

const Question = mongoose.model('Question',questionSchema)
const answerSchema = new mongoose.Schema({
    answer : String,
    user : {
        type : mongoose.Types.ObjectId,
        ref : 'User'
    },
    question : {
        type : mongoose.Types.ObjectId,
        ref : 'Question'
    },
    time : {
        type : Date,
        default : new Date()

    },

})

const Answer = mongoose.model('Answer',answerSchema)

//route
app.get('/', async function (req, res) {
    var question_dict = {};
    var q_dict = {};
    
    const questions = await Question.find().populate('user').sort({_id:-1})
    // console.log(questions);
    // console.log(answers)

        if (questions !== undefined && questions.length !== 0) {
            const QuestionDict = questions.map(question => ({
                title: question.title,
                category : question.category,
                time : question.time,
                _id : question._id,
                user: {
                    img: question.user.img, 
                    user: question.user.user, 
                    name: question.user.name, 
                   
                }
            }));

    
            if(req.session.user !== undefined){
                const user = await User.find({email : req.session.user})
                // console.log(user[0]);
                data = {
                    'session' : req.session.user,
                    "loged_in" : true,
                    'questions' : QuestionDict,
                    'question_available' : true,
                    'user' : user[0]
                }
                res.render('index',data);
            }
            else{
        
                data = {
                    'session' : req.session.user,
                    "loged_in" : false,
                    'questions' : QuestionDict,
                    'question_available' : true,
                }
                res.render('index',data);
            }
        } else {
            // if(req.session.user !== undefined){
            //     const user = await User.find({email : req.session.user})
            //     // console.log(user[0]);
            //     data = {
            //         'session' : req.session.user,
            //         "loged_in" : true,
            //         'user' : user[0]
            //     }
        
                res.redirect("/ask")
        }
  
    

})
app.get('/ask', async function (req, res) {
    if(req.session.user !== undefined){
        const user = await User.find({email : req.session.user})

        data = {
            'session' : req.session.user,
            "loged_in" : true,
            'user' : user[0]
        }
        res.render('ask',data);
    }
    else{
        res.redirect("/login")
    }
})
app.post('/ask', function (req, res) {
    if(req.session.user !== undefined){
         if(req.body.title != undefined && req.body.description != undefined && req.body.category != undefined){
            User.find({email : req.session.user}).then(result=>{

                const question = new Question({title : req.body.title,description : req.body.description, category : req.body.category, user : result[0]._id})
                question.save()
                res.redirect("/")
            })
        }
        else{
            console.log("you need to fillup all info")
        }
    }
    else{
        res.redirect("/login")
    }
})
app.get('/answer/:qId/:qTitle',async function (req, res) {
    const question = await Question.find({_id : req.params.qId})
    const user = await User.find({_id : question[0].user})
    const answers = await Answer.find().populate('user question');
    // console.log(answers)
    const answerDict = answers.map(answer => ({
        answerText: answer.answer,
        user: {
            img: answer.user.img, 
            user: answer.user.user, 
            name: answer.user.name, 
           
        }
    }));

    if(req.session.user !== undefined){
        // console.log(answerDict);
        data = {
            "loged_in" : true,
            'question': question[0],
            'user' : user[0],
            'answers' : answerDict,
        }
        res.render('answer',data);
    }
    else{
        // console.log(answerDict);

        data = {
            "loged_in" : false,
            'question': question[0],
            'user' : user[0],
            'answers' : answerDict,
        }

        res.render('answer',data);
    }
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
                                    user : req.body.username,
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
app.post("/answer/:qId",async (req,res)=>{
    if(req.body.answer != undefined){
        User.find({email : req.session.user}).then(result=>{
        const answer = new Answer({
            'answer' : req.body.answer,
            'user' : result[0]._id,
            'question' : req.params.qId
        })
        answer.save()
        res.redirect("/")
    })
    }
    else{
        console.log("answer is empty")
    }
})

app.get("/profile/answer",async (req,res)=>{
    if(req.session.user != undefined){
        const user = await User.find({email : req.session.user})
        const questions = await Question.find({user : user[0]._id})
        const answers = await Answer.find({user : user[0]._id})
        const answers_dict = await Answer.find({user : user[0]._id}).populate('question')
        console.log(answers_dict);
        data = {
            'loged_in' : true,
            'user' : user[0],
            'questions' : questions,
            'answers' : answers,
            'no_of_ques' : questions.length,
            'no_of_ans' : answers.length,
            'answers_dict' : answers_dict
        }
        res.render("profile_answer",data)
    }
    else{
        res.redirect("/login")
    }
})
app.get("/profile/:user",async (req,res)=>{
    if(req.session.user != undefined){
        const u = await User.find({email : req.session.user})
        if(u[0].user === req.params.user){
            res.redirect("/profile")
        }
        else{

        
        const main_user = await User.find({user : req.params.user})
        if(main_user != undefined && main_user.length != 0){
            const questions = await Question.find({user : main_user[0]._id})
            const answers = await Answer.find({user : main_user[0]._id})
            data = {
                'loged_in' : true,
                'user' : main_user[0],
                'questions' : questions,
                'answers' : answers,
                'no_of_ques' : questions.length,
                'no_of_ans' : answers.length,
            }
            res.render("otherprofile",data)
        }
        else{
        res.redirect("/")

        }
    }

    }
    else{
        const main_user = await User.find({user : req.params.user})
        if(main_user != undefined && main_user.length != 0){
            const questions = await Question.find({user : main_user[0]._id})
            const answers = await Answer.find({user : main_user[0]._id})
            data = {
                'loged_in' : false,
                'user' : main_user[0],
                'questions' : questions,
                'answers' : answers,
                'no_of_ques' : questions.length,
                'no_of_ans' : answers.length,
            }
            res.render("otherprofile",data)
        }
        else{
        res.redirect("/")

        }
    }
})
app.get("/profile/answer/:user",async (req,res)=>{
    if(req.session.user != undefined){
        const u = await User.find({email : req.session.user})
        if(u[0].user === req.params.user){
            res.redirect("/profile")
        }
        else{

        
        const main_user = await User.find({user : req.params.user})
        if(main_user != undefined && main_user.length != 0){
            const questions = await Question.find({user : main_user[0]._id})
            const answers = await Answer.find({user : main_user[0]._id})
            const answers_dict = await Answer.find({user : main_user[0]._id}).populate('question')

            
            data = {
                'loged_in' : true,
                'user' : main_user[0],
                'questions' : questions,
                'answers' : answers,
                'no_of_ques' : questions.length,
                'no_of_ans' : answers.length,
                'answers_dict' : answers_dict
            }
            res.render("otherprofileanswer",data)
        }
        else{
        res.redirect("/")

        }
    }

    }
    else{
        const main_user = await User.find({user : req.params.user})
        if(main_user != undefined && main_user.length != 0){
            const questions = await Question.find({user : main_user[0]._id})
            const answers = await Answer.find({user : main_user[0]._id})
            const answers_dict = await Answer.find({user : main_user[0]._id}).populate('question')

            data = {
                'loged_in' : false,
                'user' : main_user[0],
                'questions' : questions,
                'answers' : answers,
                'no_of_ques' : questions.length,
                'no_of_ans' : answers.length,
                'answers_dict' : answers_dict
            }
            res.render("otherprofileanswer",data)
        }
        else{
        res.redirect("/")

        }
    }
})
app.get("/profile",async (req,res)=>{
    if(req.session.user != undefined){
        const user = await User.find({email : req.session.user})
        const questions = await Question.find({user : user[0]._id})
        const answers = await Answer.find({user : user[0]._id})
        data = {
            'loged_in' : true,
            'user' : user[0],
            'questions' : questions,
            'answers' : answers,
            'no_of_ques' : questions.length,
            'no_of_ans' : answers.length,
        }
        res.render("profile",data)
    }
    else{
        res.redirect("/login")
    }
})

app.get("/category/:cat",async(req,res)=>{
    const questions = await Question.find({category : req.params.cat}).populate('user').sort({_id:-1})
    // console.log(questions);
    // console.log(answers)

        if (questions !== undefined && questions.length !== 0) {
            const QuestionDict = questions.map(question => ({
                title: question.title,
                category : question.category,
                time : question.time,
                _id : question._id,
                user: {
                    img: question.user.img, 
                    user: question.user.user, 
                    name: question.user.name, 
                   
                }
            }));

    
            if(req.session.user !== undefined){
                const user = await User.find({email : req.session.user})
                // console.log(user[0]);
                data = {
                    'session' : req.session.user,
                    "loged_in" : true,
                    'questions' : QuestionDict,
                    'question_available' : true,
                    'user' : user[0]
                }
                res.render('index',data);
            }
            else{
        
                data = {
                    'session' : req.session.user,
                    "loged_in" : false,
                    'questions' : QuestionDict,
                    'question_available' : true,
                }
                res.render('index',data);
            }
        } else {
            // if(req.session.user !== undefined){
            //     const user = await User.find({email : req.session.user})
            //     // console.log(user[0]);
            //     data = {
            //         'session' : req.session.user,
            //         "loged_in" : true,
            //         'user' : user[0]
            //     }
        
                res.redirect("/ask")
        }
  
    
})
// app.get("/search",async(req,res)=>{
//     // console.log(req.body.search)
//     const questions = await Question.find({title_contails : req.params.search}).populate('user').sort({_id:-1})
//     // console.log(questions);
//     // console.log(answers)

//         if (questions !== undefined && questions.length !== 0) {
//             const QuestionDict = questions.map(question => ({
//                 title: question.title,
//                 category : question.category,
//                 time : question.time,
//                 _id : question._id,
//                 user: {
//                     img: question.user.img, 
//                     user: question.user.user, 
//                     name: question.user.name, 
                   
//                 }
//             }));

    
//             if(req.session.user !== undefined){
//                 const user = await User.find({email : req.session.user})
//                 // console.log(user[0]);
//                 data = {
//                     'session' : req.session.user,
//                     "loged_in" : true,
//                     'questions' : QuestionDict,
//                     'question_available' : true,
//                     'user' : user[0]
//                 }
//                 res.render('index',data);
//             }
//             else{
        
//                 data = {
//                     'session' : req.session.user,
//                     "loged_in" : false,
//                     'questions' : QuestionDict,
//                     'question_available' : true,
//                 }
//                 res.render('index',data);
//             }
//         } else {
//             // if(req.session.user !== undefined){
//             //     const user = await User.find({email : req.session.user})
//             //     // console.log(user[0]);
//             //     data = {
//             //         'session' : req.session.user,
//             //         "loged_in" : true,
//             //         'user' : user[0]
//             //     }
        
//                 res.redirect("/ask")
//         }
  
    
// })



app.listen(3000)

