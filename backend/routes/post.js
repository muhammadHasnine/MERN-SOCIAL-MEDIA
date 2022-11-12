const express = require("express");
const {
  createPost,
  likeOrDislike,
  deletePost,
  getPostOfFollowing,
  updateCaption,
} = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();
router.route("/post/upload").post(isAuthenticated, createPost);
router
  .route("/post/:id")
  .get(isAuthenticated, likeOrDislike)
  .put(isAuthenticated, updateCaption)
  .delete(isAuthenticated, deletePost);
router.route("/posts").get(isAuthenticated, getPostOfFollowing);
module.exports = router;
