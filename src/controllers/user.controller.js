import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asynchandler(async(req,res)=>{
    //get user deatils from frontend
    //validation
    //check If user ALready Exist:username, email
    //check for images , check for Avtar
    //upload them cloudinary,avatar
    // create user object- create entry in db
    //remove password and referesh token field from response
    //Chevk form user vreation
    // return res

    const {fullname,email,username,password} = req.body
    console.log("email:",email);

    if(
         [fullname,email,username,password].some((field)=>
         field?.trim()=== "")
    ){
        throw new ApiError(400,"All feilds are required");
    }

    const existedUser = await User.find({
        $or: [{ username: username }, { email: email }]
    });
    
    
    if(existedUser > 0)
    {
         throw new ApiError(409,"User with Email alrerady exist")
    }
    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath =  req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath= req.files.coverImage[0].path;
    }

    if(!avatarLocalPath)
         throw new ApiError(400,"Avatar file is requierd")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is requierd")
    }

    const user= await User.create({
        fullname,
        avatar:avatar.url,
        coverimage:coverImage?.url || "",
        email: email.toLowerCase(),
        password,
        username:username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user" )
    }


    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )
})

const generateAccessAndRefereshToken = async(userId)=>{
    try{
         const user= await User.findById(userId)
         const accessToken=user.generateAccessToken()
         const refreshToken=user.generateRefreshToken()

         user.refreshToken=refreshToken
         await user.save({validateBeforeSave:false})

         return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500,"Something went worng while generating referesh adnd access token ")
    }
}
const loginUser = asynchandler(async(req,res)=>{
    // req body->data
    //username or email
    // find the user
    //password check
    // access and referesh token 
    // send cookie


    const {email,username,password}= req.body

    if(!username && !email){
        throw new ApiError(400,"userame or password is rerquired")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
         throw new ApiError(400,"User not found")
    }
    const isPassword = await user.isPasswordcorrect(password)
    if(!isPassword){
        throw new ApiError(401,"Invalid user credentials ")
   }
    
   const {accessToken,refreshToken}=await generateAccessAndRefereshToken(user._id)
   
   const loggedInUser=User.findById(user._id)
   select("-password -refreshToken")

   const options= {
    httpOnly:true,
    secure:true
   }
   return res
   .status(200).cookie("accessToken", accessToken,options)
   .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,
                refreshToken
            },
            "User Logged in Successfully"
        )
    )
  
})

const logoutUser = asynchandler(async(req,res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
            refreshToken:undefined
        }
      },
      {
        new:true
      }
   )

   const options= {
    httpOnly:true,
    secure:true
   }

   return res.status(200).clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json( new ApiResponse(200 ,{}, "User Logged Out Successfully"))

})

export {registerUser,loginUser,logoutUser}