const express = require("express");
const { getAllUsers } = require("../db");
const usersRouter = express.Router();

usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users");

  next();
});

// GET /api/users
usersRouter.get("/", async (req, res) => {
  const users = await getAllUsers();
  res.send({
    success: true,
    users,
  });
});

// POST /api/users/register

// POST /api/users/login

// DELETE /api/users/:id

module.exports = usersRouter;
