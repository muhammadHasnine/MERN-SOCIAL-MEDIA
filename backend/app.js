const express = require('express');
const user = require('./routes/user');
const post = require('./routes/post');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const app = express();
app.use(cors({
    origin:"https://stately-elf-873fbd.netlify.app",
    credentials:true
}))
//Config for local
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config({path:"backend/config/config.env"})
}
//Using Middlewares

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}))

//Inital display in browser
app.get("/",(req,res)=>{
    res.send("Backend is Working")
})

//Routes
app.use("/api/v1",post)
app.use("/api/v1",user)
module.exports = app;