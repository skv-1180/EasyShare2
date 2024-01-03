//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());//for using json object

//passport
app.use(session({//set up session
  secret: "Our little secret.",//keep secret in env
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());//initialize passport
app.use(passport.session());//use passport session

// mongoose.connect("mongodb://127.0.0.1:27017/csuserDB");
mongoose.connect(process.env.MONGO_URI);
// mongoose.set("useCreateIndex", true);//to remove passport warning

const userSchema = new mongoose.Schema({
  username: String,
  sharedCode: String,
  receivedCode: [
    {
      senderUsername:String,
      code: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  password: String,
});


userSchema.plugin(passportLocalMongoose);//add plugin to userSchema

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());//create cookies
passport.deserializeUser(User.deserializeUser());//destroy cookies

var currentUser = "NULL";
app.get("/", function(req,res){
  res.render("index"); 
});

app.get("/login", function(req,res){
  res.render("login");
})

app.get("/register", function(req,res){
  res.render("register");
})

app.get("/logout", function(req,res){
  req.logout(function(err) {//passport function logout
      if (err) { return next(err); }
      currentUser = "NULL";
      res.redirect('/');
  });
});

app.get("/user/:currentUser", function(req,res){
  // console.log(req.user);
  console.log(req.user);
  if(req.isAuthenticated() && currentUser === req.params.currentUser){
    res.render("userpage",{username: currentUser,receivedCode:req.user.receivedCode});
    // res.render("secrets");
  }else{
    res.redirect("/login");
  }
}) 

app.get("/forgot",function(req,res){
  res.render("forgot");
})

app.post("/deleteCode/:currentUser", async function(req, res) {
  const username = req.params.currentUser;
  const index = req.body.index;

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.receivedCode.splice(index, 1);
    await user.save();

    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.post("/user/:currentUser", async function(req, res) {
  const username = req.body.handle;
  const receivedCode = req.body.code;
  // const senderUsername = req.user.username;
  const senderUsername = currentUser;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: username },
      {
        $push: {
          receivedCode: {
            senderUsername: senderUsername,
            code: receivedCode,
          },
        },
      },
      { new: true } // To return the updated document
    );
    var limit = 20;
    if (updatedUser) {
      // Check if the length of receivedCode array exceeds limit
      if (updatedUser.receivedCode.length > limit) {
        // If yes, remove the oldest messages to keep the length at limit
        updatedUser.receivedCode.splice(0, updatedUser.receivedCode.length - limit);
      }

      // Save the updated user document
      await updatedUser.save();

      return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post("/login", function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
   });
  //  this login function comes from passport
  //  it takes user and search in db
   req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local", {
        failureRedirect: "/login", // Redirect to /login on failure
      })(req, res, function () {
        // const currentUser = req.body.username;
        currentUser = req.body.username;
        res.redirect("/user/" + currentUser);
        // You can add more logic here if needed
      });
    }
   })
})  

app.post("/register", function(req, res){
  //this register method is from passport it will do all thing saving and interacting
  User.register({username: req.body.username, receivedCode: [{senderUsername: "CodeLegendX",code: "//Share Your Code Now",},]}, req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }else{
        passport.authenticate("local")(req,res,function(){
          // const currentUser = req.body.username;
          currentUser = req.body.username;
          res.redirect("/user/"+currentUser);
        })
    }
} )
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
 