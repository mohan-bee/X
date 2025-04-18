const User=require('../models/user.model')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')



exports.register=async(req,res)=>{

    try{
        const{username,email,password,role}=req.body

        if (password.length<6) throw 'password must contain atleast 6 characters'

        const userexist=await User.findOne({email})
        if(userexist){
            return res.status(400).json({msg:"user already exist"})
        }


        const hashpassword=await bcrypt.hash(password,10)




        const user=new User({
            username,
            email,
            password:hashpassword,
            role,
        })

        await user.save()

        res.status(200).json({
            success:true,
            user:
        {
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }
        })


    } catch(error){

        console.log('error during register',error);
        
    }

}



exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (password.length < 6) throw 'password must contain at least 6 characters';
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "invalid credentials" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "invalid credentials" });
      }
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
      });
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });
  
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.log('error during login', error);
      res.status(500).json({ msg: "Server Error" });
    }
  };
  

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {

        console.log(error);
        
    }
  };