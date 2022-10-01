const express = require("express");
const { getAllPosts, createPost, getPostById, updatePost } = require("../db");
const { requireUser } = require("./utils");
const postsRouter = express.Router();

// GET /api/posts
postsRouter.get("/", async (req, res, next) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(
      (post) => post.active || (req.user && post.author.id === req.user.id)
    );

    res.send({ success: true, posts });
  } catch ({ name, message }) {
    next({ success: false, name, message });
  }
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
    console.log(originalPost);
    console.log("IDs: ", originalPost.author.id, req.user.id);
    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
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
postsRouter.delete("/:postId", requireUser, async (req, res, next) => {
  try {
    const post = await getPostById(req.params.postId);

    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });

      res.send({ success: true, post: updatedPost });
    } else {
      // if there was a post, throw unauthorized user error, otherwise throw post not found error
      next(
        post
          ? {
              success: false,
              name: "UnauthorizedUserError",
              message: "You cannote delete a post which is not yours",
            }
          : {
              success: false,
              name: "PostNotFoundError",
              message: "That post does not exist",
            }
      );
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = postsRouter;
