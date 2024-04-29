import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const user = req.user;
  const { tweet } = req.body;
  
  if (!user) {
    throw new ApiError(400, "No Such User");
  }
  if (!tweet) {
    throw new ApiError(400, "Provide content to post as tweet");
  }

  const tweetNew = await Tweet.create({
    content: tweet,
    owner: user._id,
  });

  if (!tweetNew) {
    throw new ApiError(500, "Problem in creating tweet");
  }

  return res.status(200).json(new ApiResponse(200, { tweetNew }, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { id } = req.params;
  const tweets = await Tweet.find({ owner: new mongoose.Types.ObjectId(id) });
  const tweetsagg = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "usertweets",
      },
    },
    {
      $unwind: "$usertweets",
    },
    {
      $group: {
        _id: null,
        content: { $push: "$tweet" },
        User: { $first: "$usertweets" },
      },
    },
    {
      $project: {
        _id: 0,
        content: 1,
        User: {
          fullName: 1,
          avatar: 1,
          email: 1,
          username: 1,
        },
      },
    },
  ]);

  if (!tweets) {
    throw new ApiError(400, "No Tweets by this user");
  }

  return res.status(200).json(new ApiResponse(200, { tweets }, "These are user tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { tweet } = req.body;

  if (!tweetId) {
    throw new ApiError(400, "Please provide a tweet id");
  }
  if (!tweet) {
    throw new ApiError(400, "Please provide a tweet");
  }
  
  const findTweet = await Tweet.findById(tweetId);
  
  if (!findTweet) {
    throw new ApiError(404, "Tweet not found");
  }
  
  if (findTweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }
  
  try {
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { $set: { content: tweet } },
      { new: true }
    );

    if (!updatedTweet) {
      throw new ApiError(500, "An error occurred while trying to update a tweet");
    }

    return res.status(200).json(new ApiResponse(200, { updatedTweet }, "Tweet updated successfully"));
  } catch (error) {
    throw new ApiError(500, "An error occurred while trying to update a tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Please provide a tweet id");
  }

  const findTweet = await Tweet.findById(tweetId);

  if (!findTweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (findTweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  try {
    const deletedTweet = await Tweet.findByIdAndDelete(
      { _id: tweetId },
      { new: true }
    );

    if (!deletedTweet) {
      throw new ApiError(500, "An error occurred while trying to delete a tweet");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Tweet cannot be deleted at this time");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
