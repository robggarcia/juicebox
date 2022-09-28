const express = require("express");
const { getAllPosts } = require("../db");
const postsRouter = express.Router();

// GET /api/posts
postsRouter.get("/", async (req, res) => {
  const posts = await getAllPosts();
  res.send({ success: true, posts });
});

// POST /api/posts

// PATCH /api/posts/:id

// DELETE /api/posts/id

module.exports = postsRouter;
