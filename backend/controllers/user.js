const User = require("../models/user");
//Registretion of an user
exports.register = async (req, res) => {
  try {
    const {name,email,password} = req.body
    let user = await User.findOne({email})
    if(user){
      return res.status(400).json({
        success:false,
        message:"User already exists"
      })
    }
    user = await User.create({
      name,
      email,
      password,
      avatar:{
        public_id:"cloudinary_id",
        url:"cloudinary_url"
      }
    })
    const token = await user.generateToken()
    const options = {
      expires: new Date(Date.now()+90*24*60*60*1000),
      httpOnly:true
    }
    res.status(201).cookie("token",token,options).json({
      success:true,
      user,
      token
    })
  } catch (error) {
    res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};
//User Log in
exports.login = async (req,res)=>{
  try {
    const {email,password} = req.body
    const user = await User.findOne({email}).select("+password");
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User dose not exist"
      })
    }
    const isMatch = await user.matchPassword(password)
    if(!isMatch){
      return res.status(400).json({
        success:true,
        message:"Incorrect Password"
      })
    }
    const token = await user.generateToken()
    const options = {
      expires: new Date(Date.now()+90*24*60*60*1000),
      httpOnly:true
    }
    res.status(200).cookie("token",token,options).json({
      success:true,
      user,
      token
    })
  } catch (error) {
    res.status(500).json({
      success:true,
      message:error.message
    })
  }
}
//Logout
exports.logout = async(req,res)=>{
  try {
    res.status(200).cookie("token",null,{expires:new Date(Date.now()),httpOnly:true}).json({
      success:true,
      message:"Logged Out"
    })
  } catch (error) {
    res.status(500).json({
      success:true,
      message:error.message
    })
  }
}
//Follow or Unfollow User
exports.followUser = async(req,res)=>{
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);
    if(!userToFollow){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }
    if(loggedInUser.following.includes(userToFollow._id)){
      const indexOfFollwing = loggedInUser.following.indexOf(userToFollow._id);
      const indexOfFollwers = userToFollow.followers.indexOf(loggedInUser._id);
      loggedInUser.following.splice(indexOfFollwing,1);
      userToFollow.followers.splice(indexOfFollwers,1);
      await loggedInUser.save();
      await userToFollow.save();
      return res.status(200).json({
        success:true,
        message:`${userToFollow.name} unfollowed`
      })
    }else{
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);
      await loggedInUser.save();
      await userToFollow.save();
      return res.status(200).json({
        success:true,
        message:`${userToFollow.name} followed`
      })
    }
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}
//Update Password
exports.updatePassword = async(req,res)=>{
  try {
    const user = await User.findById(req.user._id).select("+password");
    const {oldPassword,newPassword} = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide old and new password",
      });
    }
    const isMatch = await user.matchPassword(oldPassword)
    if(!isMatch){
      return res.status(400).json({
        success:true,
        message:"Incorrect oldPassword"
      })
    }
  user.password = newPassword;
  await user.save();
  return res.status(200).json({
    success:true,
    message:"Password Updated"
  });
} catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
}
//Update Profile
exports.updateProfile = async(req,res)=>{
  try {
    const user = await User.findById(req.user._id);
    const {name,email}=req.body
    if(name){
      user.name = name;
    }
    if(email){
      user.email = email;
    }
    await user.save();
    res.status(200).json({
      success:true,
      message:"Profile updated"
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
}