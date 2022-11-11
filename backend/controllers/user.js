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
