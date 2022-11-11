const Post = require("../models/post");
exports.createPost = async (req, res) => {
  try {
    
  } catch (error) {
    res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};