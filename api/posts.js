const express = require("express");
const { reset } = require("nodemon");
const { getAllPosts, createPost, getPostById } = require("../db");
const { requireUser } = require("./utils");
const postsRouter = express.Router();

// GET /api/posts
postsRouter.get("/", async (req, res) => {
  const posts = await getAllPosts();
  res.send({ success: true, posts });
});

// POST /api/posts
postsRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/);
  const postData = {};

  // only send the tags if there are some to send
  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;
    const post = await createPost(postData);
    if (!post) {
      next({
        success: false,
        message: "Create Post failed. Did not include all necessary arguments",
      });
    }
    res.send({ post });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// PATCH /api/posts/:id
postsRouter.patch("/:postId", requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.authorId === req.user.id) {
      const updatedPost = await updatedPost(postId, updateFields);
      res.send({ success: true, post: updatedPost });
    } else {
      next({
        success: false,
        name: "UnauthorizedUserError",
        message: "You cannot update a post that is not yours",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// DELETE /api/posts/:id

module.exports = postsRouter;
