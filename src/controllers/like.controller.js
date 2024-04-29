import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  // TODO: toggle like on video
  if (!videoId) 
    throw new ApiError(400, "No such video");
  
  const user = req.user;
  const alreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);
    return res.status(200).json(new ApiResponse(200, "Video unliked successfully"));
  }
  
  const like = await Like.create({
    video: videoId,
    likedBy: user._id,
  });

  return res.status(200).json(new ApiResponse(200, { like }, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  
  // TODO: toggle like on comment
  if (!commentId) 
    throw new ApiError(400, "No such comment");
  
  const user = req.user;
  const alreadyLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);
    return res.status(200).json(new ApiResponse(200, "Comment unliked successfully"));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: user._id,
  });

  return res.status(200).json(new ApiResponse(200, { like }, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  
  // TODO: toggle like on tweet
  if (!tweetId) 
    throw new ApiError(400, "No such tweet");
  
  const user = req.user;
  const alreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (alreadyLiked) {
    await Like.findByIdAndDelete(alreadyLiked?._id);
    return res.status(200).json(new ApiResponse(200, "Tweet unliked successfully"));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: user._id,
  });

  return res.status(200).json(new ApiResponse(200, { like }, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videodetail",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "userdetail",
      },
    },
    {
      $project: {
        video: 1,
        videodetail: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
        },
        userdetail: {
          _id: 1,
          username: 1,
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { likedVideos }, "Liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
