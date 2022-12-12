const User = require("../models/user");
const Post = require("../models/post");
const {sendEmail} = require("../middlewares/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
//Registretion of an user
exports.register = async (req, res) => {
  try {
    const { name, email, password,avatar } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const myCloud = await cloudinary.v2.uploader.upload(avatar,{
      folder:"avatar"
    })
    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite:"lax"
      
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};
//User Log in
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password").populate("posts followers following")
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User dose not exist",
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: true,
        message: "Incorrect Password",
      });
    }
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite:"none",
      secure:true
    };
    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};
//Logout
exports.logout = async (req, res) => {
  try {
    const options = { 
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 
      httpOnly: true, 
      sameSite: "none", 
      secure: true 
    }
    res.status(200).cookie("amigo","treas", options)
      .json({
        success: true,
        message: "Logged Out",
      });
  } catch (error) {
    res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};
//Follow or Unfollow User
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexOfFollwing = loggedInUser.following.indexOf(userToFollow._id);
      const indexOfFollwers = userToFollow.followers.indexOf(loggedInUser._id);
      loggedInUser.following.splice(indexOfFollwing, 1);
      userToFollow.followers.splice(indexOfFollwers, 1);
      await loggedInUser.save();
      await userToFollow.save();
      return res.status(200).json({
        success: true,
        message: `you unfollowed ${userToFollow.name}`,
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);
      await loggedInUser.save();
      await userToFollow.save();
      return res.status(200).json({
        success: true,
        message: `Now you are following ${userToFollow.name}`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Update Password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: true,
        message: "Incorrect oldPassword",
      });
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Password Updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, email, avatar } = req.body;
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if(avatar){
      await cloudinary.v2.uploader.destroy(user.avatar.public_id)
      const myCloud = await cloudinary.v2.uploader.upload(avatar,{
        folder:"avatar"
      })
      user.avatar.public_id = myCloud.public_id
      user.avatar.url = myCloud.secure_url
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Delete User Profile
exports.deleteMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = user.posts;
    const followers = user.followers;
    const following = user.following;
    const userId = user._id;
    //removeing photo from cloudinary
    await cloudinary.v2.uploader.destroy(user.avatar.public_id)
    //removeing user from db
    await user.remove();
    //logout after deleting profile
    const options = { 
      expires: new Date(Date.now()), 
      // httpOnly: true, 
      sameSite: "none", 
      secure: true 
    }
    res.cookie("token", null, options);
    //delete all post of the user
    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findById(posts[i]);
      //delete  photo  from  user  posts
      await cloudinary.v2.uploader.destroy(post.image.public_id);
      //delete user posts
      await post.remove();
    }
    //removeing user from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }
    //removeing user from following's followers
    for (let i = 0; i < following.length; i++) {
      const follows = await User.findById(following[i]);
      const index = follows.followers.indexOf(userId);
      follows.followers.splice(index, 1);
      await follows.save();
    }
    //remove all comments of the user from all posts
    const allPost = await Post.find();
    for (let i = 0; i < allPost.length; i++) {
      const post = await Post.findById(allPost[i]._id);
      for (let j = 0; j < post.comments.length; j++) {
        if(post.comments[j].user.toString() === userId.toString()){
          post.comments.splice(j,1) 
        }
      }
      await post.save();
    }
    //remove all likes of the user from all posts
    for (let i = 0; i < allPost.length; i++) {
      const post = await Post.findById(allPost[i]._id);
      for (let j = 0; j < post.likes.length; j++) {
        if(post.likes[j].toString() === userId.toString()){
          post.likes.splice(j, 1)
          console.log(true)
        }
      }
      await post.save();
      console.log("like deleted")
    }
    console.log(userId)
    
    res.status(200).json({
      success: true,
      message: "Profile Deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Get My Profile
exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("posts followers following");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("posts followers following");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Get All Users Profile
exports.getAllUsersProfile = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({email:req.body.email});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const resetPasswordToken = user.getResetPasswordToken()
    await user.save();
    const resetUrl = `https://ajtimae.netlify.app/api/v1/password/reset/${resetPasswordToken}`
    const message = `Reset your password by clicking this link -  ${resetUrl}`
    try {
      await sendEmail({
        email:user.email,
        subject:"Reset Password",
        message
      })
      res.status(200).json({
        success:true,
        message:`Email send to ${user.email}`
      })
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({
        success:false,
        message:error.message
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//Reset Password
exports.resetPassword = async(req,res)=>{
  try {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({resetPasswordToken,resetPasswordExpire:{$gt:Date.now()}});
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or has been expired",
      });
    }
    user.password = req.body.password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(200).json({
      success:true,
      message:"Password Updated"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
exports.getMyPosts = async(req,res)=>{
  try {
    const user = await User.findById(req.user._id);
    const posts = []
    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate("likes comments.user owner")
      posts.push(post);
      
    }
    res.status(200).json({
      success:true,
      posts
    })
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}
exports.getUserPosts = async(req,res)=>{
  try {
    const user = await User.findById(req.params.id);
    const posts = []
    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate("likes comments.user owner")
      posts.push(post);
      
    }
    res.status(200).json({
      success:true,
      posts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}