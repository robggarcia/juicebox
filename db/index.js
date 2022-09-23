const { Client } = require("pg");

const client = new Client({
  password: "postgres",
  user: "postgres",
  database: "juicebox",
});

const createUser = async ({ username, password, name, location }) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
            INSERT INTO users(username, password, name, location)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `,
      [username, password, name, location]
    );
    return user;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users;`
  );
  console.log("getAllUsers: ", rows);
  return rows;
};

const updateUser = async (id, fields = {}) => {
  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }
  //   console.log("fields", fields);
  //   console.log("setString", setString);
  try {
    const result = await client.query(
      `
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
    `,
      Object.values(fields)
    );

    return result;
  } catch (error) {
    throw error;
  }
};

const createPost = async ({ authorId, title, content }) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
              INSERT INTO posts("authorId", title, content)
              VALUES ($1, $2, $3)
              RETURNING *;
          `,
      [authorId, title, content]
    );
    return post;
  } catch (error) {
    throw error;
  }
};

const updatePost = async (id, { title, content, active }) => {
  try {
    const result = await client.query(
      `
          UPDATE posts
          SET title = $1,
          content = $2,
          active = $3
          WHERE id=${id}
          RETURNING *;
      `,
      [title, content, active]
    );

    return result;
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  const { rows } = await client.query(
    `SELECT id, title, content, active, active FROM posts;`
  );
  return rows;
};

const getPostsByUser = async (userId) => {
  const { rows } = await client.query(
    `
        SELECT * FROM posts where "authorId"=$1
    `,
    [userId]
  );
  return rows;
};

const getUserById = async (userId) => {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users WHERE id=$1`,
    [userId]
  );
  if (rows.length === 0) return null;

  console.log("...getting posts from user");
  rows.posts = await getPostsByUser(userId);
  return rows;
};

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getUserById,
};
