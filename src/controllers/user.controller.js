import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //1. get use details from frontend (i.e. postman)
    //2. validation - not empty
    //3. check if use already exists: username, email
    //4. check for images, check for avatar.
    //5. upload then on cloudinary, avatar.
    //6. create user object - create entry in db.
    //7. remove password and refresh token field from res.
    //8. check for use creation.
    //9. return response.


    const { userName, fullName, email, password } = req.body

    //2.validation required field
    if ([userName, email, fullName, password].some((fields) => fields.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }
    //3.check if user already exist.
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists")
    }
        
    // 4.check for avatar file
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }   
    
    //5. upload then on cloudinary, avatar.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //6. create user object - create entry in db.
    const user = await User.create({
        userName: userName.toLowerCase(),
        fullName: fullName,
        email: email,
        password: password,
        avatar: avatar.url,
        coverImage: coverImage.url || ""
    })
    
    //7. remove password and refresh token field from res.
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")

    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created succefully")
    )
})

export { registerUser }