const express = require("express");
const {
  getAllUsers,
  getUserByUsername,
  createUser,
  deleteUserByUserId,
  activateUserByUserId,
} = require("../db");
const usersRouter = express.Router();
const jwt = require("jsonwebtoken");
const { requireUser } = require("./utils");
const { JWT_SECRET } = process.env;

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
usersRouter.post("/register", async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      next({
        name: "UserExistsError",
        message: "A user by that username already exists",
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    res.send({
      success: true,
      message: "thank you for signing up",
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// POST /api/users/login
usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password",
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      // create token and return to user
      const token = jwt.sign(user, JWT_SECRET);

      res.send({ success: true, message: "you're logged in!", token });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "Username or password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// DELETE /api/users/:id
usersRouter.delete("/:userId", requireUser, async (req, res, next) => {
  try {
    if (req.user.id === +req.params.userId) {
      const user = await deleteUserByUserId(req.params.userId);
      res.send({
        success: true,
        message: "You have successfully deactivated user",
        user: user,
      });
    } else {
      res.send({
        success: false,
        message:
          "Deactivate user failed. Users can only deactivate their own account",
      });
    }
  } catch ({ name, message }) {
    next({ success: false, name, message });
  }
});

// PATCH /api/users/:userId
usersRouter.patch("/:userId", requireUser, async (req, res, next) => {
  try {
    if (req.user.id === +req.params.userId) {
      const user = await activateUserByUserId(req.params.userId);
      res.send({
        success: true,
        message: "You have successfully activated user",
        user: user,
      });
    } else {
      res.send({
        success: false,
        message:
          "Activate user failed. Users can only activate their own account",
      });
    }
  } catch ({ name, message }) {
    next({ success: false, name, message });
  }
});

module.exports = usersRouter;
