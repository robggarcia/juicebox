require("dotenv").config(); // sets up the .env file
const express = require("express");
const apiRouter = require("./api");
const morgan = require("morgan");

// connect to you database
const { client } = require("./db");
client.connect();

const server = express();

server.use(morgan("dev"));
server.use(express.json());

server.use("/api", apiRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`The server is up on PORT ${PORT}`);
});
