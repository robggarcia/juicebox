const express = require("express");
const { getAllTags, getPostsByTagName } = require("../db");

const tagsRouter = express.Router();

// GET /api/tags
tagsRouter.get("/", async (req, res) => {
  const tags = await getAllTags();
  res.send({ succes: true, tags });
});

// GET /api/tags/:tagName/posts
tagsRouter.get("/:tagName/posts", async (req, res, next) => {
  const { tagName } = req.params;
  console.log("tagName", tagName);
  try {
    const allPosts = await getPostsByTagName(tagName);

    const authorActivePosts = allPosts.filter(
      (post) =>
        post.author.active || (req.user && post.author.id === req.user.id)
    );

    const posts = authorActivePosts.filter(
      (post) => post.active || (req.user && post.author.id === req.user.id)
    );

    res.send({ success: true, posts });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = tagsRouter;
