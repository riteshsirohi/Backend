import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Below controller is very important
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  
  // TODO: get all videos based on query, sort, pagination
  const filter = userId ? { owner: userId } : {};
  const sort = sortBy ? { [sortBy]: sortType === "desc" ? -1 : 1 } : {};
  
  const videos = await Video.find(filter)
    .skip((Number(page) - 1) * Number(limit))
    .limit(parseInt(limit))
    .sort(sort)
    .exec();
    
  if (!videos) throw new ApiError("Error in fetching videos");
  
  return res
    .status(200)
    .json(new ApiResponse(200, { videos }, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user;
  
  if (!userId) {
    throw new ApiError(400, "Cannot Recognise User");
  }
  
  if (!title || !description) {
    throw new ApiError(400, "Title and Description Required");
  }
  
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;
  
  if (!videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "Cannot find video and thumbnail");
  }
  
  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnailUrl = await uploadOnCloudinary(thumbnailPath);
  
  const result = await Video.create({
    videoFile: videoFile?.url,
    thumbnail: thumbnailUrl?.url,
    title,
    description,
    duration: videoFile.duration,
    views: 0,
    isPublished: true,
    owner: userId._id,
  });
  
  return res
    .status(200)
    .json(new ApiResponse(200, { result }, "Video Upload Success"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    throw new ApiError(400, "VideoId Field empty");
  }
  
  const video = await Video.findById(videoId);
  
  if (!video) throw new ApiError(404, "Video Not Found");
  
  // Can add code to check isPublished status as well
  
  return res.status(200).json(new ApiResponse(200, { video }, "Video Found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(400, "VideoId Field empty");
  }

  if (!title || !description) {
    throw new ApiError(400, "Insufficient Details To Update Video");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video Not Found");
  }

  const thumbnailPath = req.file?.path;

  if (!thumbnailPath) {
    throw new ApiError(400, "Cannot Recognize new Thumbnail");
  }

  const thumbnailNew = await uploadOnCloudinary(thumbnailPath); // Make sure to await the result

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        thumbnail: thumbnailNew?.url,
        description,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Failed To Update Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedVideo }, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    throw new ApiError(400, "VideoId Field empty");
  }
  
  const vidtoDel = await Video.findById(videoId);
  // await deleteFromCloudinary(vidtoDel.videoFile);
  // await deleteFromCloudinary(vidtoDel.thumbnail);
  
  const video = await Video.findOneAndDelete(videoId);
  
  if (!video) {
    throw new ApiError(404, "Failed To Delete Video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { video }, "deletion success"));
});

// Make functions to delete from cloudinary
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    throw new ApiError(400, "VideoId Field empty");
  }
  
  const video = await Video.findById(videoId);
  
  if (!video) throw new ApiError(404, "No Such Video");
  
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );
  
  if (!updatedVideo) throw new ApiError(400, "Failed to update video");

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedVideo }, "publish status toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
