import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { user } = req.user;
  
  if (!name || !description)
    throw new ApiError(400, "Give name and description for playlist");
  
  const playlist = await Playlist.create({
    name,
    description,
    owner: user?._id,
    videos: [],
  });
  
  if (!playlist) 
    throw new ApiError(404, "Problem in creating playlist");
  
  return res.status(200).json(
    new ApiResponse(200, { playlist }, "New Playlist created successfully")
  );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId);
  
  if (!user) 
    throw new ApiError(400, "No such user exists");
  
  const playlists = await Playlist.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "uservideos",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "completedoc",
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$uservideos" },
        totalViews: { $sum: "$uservideos.views" },
        owner: { $first: "$completedoc" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        uservideos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        completedoc: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  if (!playlists)
    throw new ApiError(404, "Error in retrieving playlists of user");

  return res.status(200).json(
    new ApiResponse(200, { playlists }, "Playlist retrieval success")
  );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  
  if (!playlistId) 
    throw new ApiError(400, "Invalid playlist");
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) 
    throw new ApiError(400, "Error in retrieving playlist");
  
  const playlistVideos = await Playlist.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    { $match: { "videos.isPublished": true } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalViews: { $sum: "$videos.views" },
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, { playlistVideos }, "Playlist retrieved successfully")
  );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  
  if (!playlistId || !videoId)
    throw new ApiError(400, "Invalid playlist or video id");
  
  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) 
    throw new ApiError(400, "Playlist not found");
  
    const addvideo = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
      );
    
      return res.status(200).json(
        new ApiResponse(200, { addvideo }, "Video added successfully")
      );
    });
    
    const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
      const { playlistId, videoId } = req.params;
    
      if (!playlistId || !videoId)
        throw new ApiError(400, "Invalid playlist or video id");
    
      const playlist = await Playlist.findById(playlistId);
    
      if (!playlist)
        throw new ApiError(400, "Playlist not found");
    
      if (playlist.owner.toString() != req.user._id.toString())
        throw new ApiError(404, "You are not the owner");
    
      const removevideo = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
      );
    
      return res.status(200).json(
        new ApiResponse(200, { removevideo }, "Video removed successfully")
      );
    });
    
    const deletePlaylist = asyncHandler(async (req, res) => {
      const { playlistId } = req.params;
    
      if (!playlistId)
        throw new ApiError(400, "Invalid playlist id");
    
      const user = req.user;
      const playlist = await Playlist.findById(playlistId);
    
      if (!playlist)
        throw new ApiError(404, "Playlist not found");
    
      if (playlistId != user._id.toString())
        throw new ApiError(404, "You are not the owner");
    
      const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    
      return res.status(200).json(
        new ApiResponse(200, { deletedPlaylist }, "Playlist deleted successfully")
      );
    });
    
    const updatePlaylist = asyncHandler(async (req, res) => {
      const { playlistId } = req.params;
      const { name, description } = req.body;
    
      if (!playlistId)
        throw new ApiError(400, "Invalid playlist id");
    
      const user = req.user;
    
      if (playlistId != user._id.toString())
        throw new ApiError(404, "You are not the owner");
    
      const playlist = await Playlist.findById(playlistId);
    
      if (!playlist)
        throw new ApiError(404, "Playlist not found");
    
      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name: name, description: description },
        { new: true }
      );
    
      return res.status(200).json(
        new ApiResponse(200, { updatedPlaylist }, "Playlist updated successfully")
      );
    });
    
    export {
      createPlaylist,
      getUserPlaylists,
      getPlaylistById,
      addVideoToPlaylist,
      removeVideoFromPlaylist,
      deletePlaylist,
      updatePlaylist,
    };
    
    
    
    
    
    
    
