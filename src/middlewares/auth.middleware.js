import { ApiError} from "../utils/ApiError.js"
import {asynchandler} from '../utils/asynchandler.js';
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";

export const verifyJWT = asynchandler(async(req,_,
    next) =>{
     try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if(!token){
           throw new ApiError(401,"Unauthorizede Request")
        }
        const decodeToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRETS)
        await User.findById(decodeToken?._id).select(
          "-password -refreshToken"
        )
        if(!user){
          throw new ApiError(401,"Invalid Access Token")
        }
        req.user= user;
        next()
     } catch (error) {
        throw new ApiError(401,error?.message || 
            "Invalid Access Token"
        )  
     }

})