const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter a name"]
    },
    avatar:{
        public_id:String,
        url:String
    },
    email:{
        type:String,
        required:[true,"Please enter an email"],
        unique:[true,"Email already exists"]
    },
    password:{
        type:String,
        required:[true,"Please enter a password"],
        minlength:[6, "Password must be at least 6 characters"],
        select:false
    },
    posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
      followers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    
      following: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
});
//Hashing Password before saving
userSchema.pre("save", async function (next){
  if(this.isModified("password")){ //if the password filed was modified then this code block will be exicute
    this.password = await bcrypt.hash(this.password,10);
  }
  next()
})
module.exports = mongoose.model("User", userSchema);
