const express = require("express");
const { getAllTags } = require("../db");

const tagsRouter = express.Router();

// GET /api/tags
tagsRouter.get("/", async (req, res) => {
  const tags = await getAllTags();
  res.send({ succes: true, tags });
});

// GET /api/tags/:tagName/posts

module.exports = tagsRouter;
