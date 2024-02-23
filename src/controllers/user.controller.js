import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/usermodel.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from  "../utils/ApiResponse.js";

const registerUser = asyncHandler (async (req,res) => {
     
     //GET USER DETAILS FROM FRONTEND
      const{fullname,email,username,password} = req.body;
       console.log("email:",email);


       //VALIDATION-NOT EMPTY
       if(
            [fullname,email,username,password].some((field) =>
            field?.trim() === "")
      ){
            throw new ApiError(400,"All fiels are required")
       }
 
        // USER EXISTING CHECK
       const existedUser = User.findOne({
            $or:[{username} , {email}]
       })

       if(existedUser){
            throw new ApiError(409,"username and email already exist")
       }

       //CHECK IMAGES
       const avatarLocalPath = req.files?.avatar[0]?.path;
       
       const coverImageLocalPath = req.files?.coverImage[0]?.path;

       if(!avatarLocalPath){
            throw new ApiError(400,"avatar file is required")
       }
         
        //UPLOAD IMAGES ON CLOUDINARY
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if(!avatar){
            throw new ApiError(400,"avatar file is required")
        }

        //CREATE USER OBJECT AND TALK WITH DB
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        })

        //REMOVE PASSWORD AND RESPONSE FIELD FROM RESPONSE
         const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
         )

          // CHECK FOR USER CREATION
         if(!createdUser){
            throw new ApiError(500,"something wnt wrong");
         }

         // RESULT RETURN 
         return res.status(201).json(
            new ApiResponse(200,"created user succesfully")
         )
})

export {registerUser}