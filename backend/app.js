const express = require('express');

//Config for local
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config({path:"backend/config/config.env"})
}
const app = express();
module.exports = app;