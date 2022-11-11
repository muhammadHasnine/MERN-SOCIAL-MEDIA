const express = require('express');
const user = require('./routes/user');
const post = require('./routes/post');
const app = express();
//Config for local
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config({path:"backend/config/config.env"})
}
//Using Middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use("/api/v1",post)
app.use("/api/v1",user)
module.exports = app;