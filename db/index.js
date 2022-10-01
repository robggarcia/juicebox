const { Client } = require("pg");

const client = new Client(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        password: process.env.POSTGRES_SECRET,
        user: "postgres",
        database: "juicebox",
      }
);

// USER Methods

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
    const {
      rows: [user],
    } = await client.query(
      `
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
    `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const { rows } = await client.query(
      `SELECT id, username, name, location, active
      FROM users;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `SELECT id, username, name, location, active 
      FROM users 
      WHERE id=$1`,
      [userId]
    );
    if (!user) return null;

    console.log("...getting posts from user");
    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
};

const getUserByUsername = async (username) => {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
      SELECT *
      FROM users
      WHERE username=$1
    `,
      [username]
    );
    return user;
  } catch (error) {
    throw error;
  }
};

// POST Methods

const createPost = async ({ authorId, title, content, tags = [] }) => {
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

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
};

const updatePost = async (postId, fields = {}) => {
  // read off the tags & remove that field
  const { tags } = fields; // might be undefined
  delete fields.tags;

  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  console.log("setString", setString);

  try {
    // update any fields that need to be updated
    if (setString.length > 0) {
      await client.query(
        `
       UPDATE posts
       SET ${setString}
       WHERE id=${postId}
       RETURNING *;
     `,
        Object.values(fields)
      );
    }

    console.log("tags", tags);

    // return early if there's no tags to update
    if (tags === undefined) {
      console.log("TAGS IS UNDEFINED");
      return await getPostById(postId);
    }

    // make any new tags that need to be made
    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

    // delete any post_tags from the database which aren't in that tagList
    await client.query(
      `
     DELETE FROM post_tags
     WHERE "tagId"
     NOT IN (${tagListIdString})
     AND "postId"=$1;
   `,
      [postId]
    );

    // and create post_tags as necessary
    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};

const getAllPosts = async () => {
  try {
    const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
    `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
};

const getPostsByUser = async (userId) => {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts
      WHERE "authorId"=${userId};
    `);

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
};

const createTags = async (tagList) => {
  if (tagList.length === 0) return;

  // create a string to create as many tags as we need. Format needed: $1), ($2), ($3)
  const insertValues = tagList.map((_, i) => `$${i + 1}`).join(`), (`);
  // then we can use (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map((_, i) => `$${i + 1}`).join(", ");
  // then we can use (${ selectValues }) in our string template

  try {
    // first insert the tags into the tags table
    await client.query(
      `
        INSERT INTO tags(name)
        VALUES (${insertValues}) 
        ON CONFLICT (name) DO NOTHING
    `,
      tagList
    );

    // then select all the tags passed in from the table and return them
    const { rows } = await client.query(
      `
      SELECT * FROM tags
      WHERE name
      IN (${selectValues})
    `,
      tagList
    );

    return rows;
  } catch (error) {
    throw error;
  }
};

const createPostTag = async (postId, tagId) => {
  try {
    await client.query(
      `
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `,
      [postId, tagId]
    );
  } catch (error) {
    throw error;
  }
};

const addTagsToPost = async (postId, tagList) => {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
};

const getPostById = async (postId) => {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
        SELECT * FROM posts WHERE id=$1;
      `,
      [postId]
    );

    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Could not find a post with that postId",
      };
    }

    const { rows: tags } = await client.query(
      `
        SELECT tags.* FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
};

const getPostsByTagName = async (tagName) => {
  try {
    const { rows: postIds } = await client.query(
      `
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `,
      [tagName]
    );

    console.log("postIds", postIds);
    return await Promise.all(postIds.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
};

const getAllTags = async () => {
  try {
    const { rows: tags } = await client.query(`
    SELECT * FROM tags;
  `);
    return tags;
  } catch (error) {
    throw error;
  }
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
  getPostsByUser,
  createTags,
  createPostTag,
  addTagsToPost,
  getPostById,
  getPostsByTagName,
  getAllTags,
  getUserByUsername,
};
