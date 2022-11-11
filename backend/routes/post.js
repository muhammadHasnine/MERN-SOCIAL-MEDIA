const express = require('express');
const {createPost, likeOrDislike, deletePost} = require('../controllers/post');
const {isAuthenticated} = require('../middlewares/auth')
const router = express.Router();
router.route("/post/upload").post(isAuthenticated,createPost);
router.route("/post/:id").get(isAuthenticated,likeOrDislike).delete(isAuthenticated,deletePost);
module.exports = router;