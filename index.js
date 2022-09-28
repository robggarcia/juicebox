require("dotenv").config(); // sets up the .env file

const express = require("express");
const apiRouter = require("./api");
const morgan = require("morgan");

const PORT = 3000;

// connect to you database
const { client } = require("./db");
client.connect();

const server = express();

server.use(morgan("dev"));
server.use(express.json());

server.use("/api", apiRouter);

server.listen(PORT, () => {
  console.log(`The server is up on PORT ${PORT}`);
});
