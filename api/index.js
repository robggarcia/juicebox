const express = require("express");
const postsRouter = require("./posts");
const tagsRouter = require("./tags");
const usersRouter = require("./users");
const apiRouter = express.Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/tags", tagsRouter);

module.exports = apiRouter;
