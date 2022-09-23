const { create } = require("domain");
const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  getUserById,
  createPost,
  getAllPosts,
  updatePost,
} = require("./index");

// this function calls a query to drop all tables from our database
const dropTables = async () => {
  try {
    console.log("Starting to drop tables...");
    await client.query(`DROP TABLE IF EXISTS posts;`);
    await client.query(`DROP TABLE IF EXISTS users;`);
    console.log("Finished dropping tables!");
  } catch (error) {
    console.log("Error dropping tables!");
    throw error; // pass the error up to the function that calls dropTables
  }
};

// this function calls a query to create all tables for our database
const createTables = async () => {
  try {
    console.log("Starting to build tables...");

    console.log("...building users table");
    await client.query(`CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
    );`);

    console.log("...building posts table");
    await client.query(`CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );`);

    console.log("Finished building tables!");
  } catch (error) {
    console.log("Error building tables!");
    throw error; // pass the error up to the function that calls createTables
  }
};

const createInitialUsers = async () => {
  try {
    console.log("Starting to create users...");
    const albert = await createUser({
      username: "albert",
      password: "bertie99",
      name: "albert",
      location: "omaha, ne",
    });
    const sandra = await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "sandy",
      location: "philadelphia, pa",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "soglam",
      name: "gabby",
      location: "richmond, va",
    });
    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!");
    throw error;
  }
};

const createInitialPosts = async () => {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
    });

    await createPost({
      authorId: sandra.id,
      title: "Having Fun",
      content:
        "I am definitely confused, but I am still having fun creating my first database.",
    });

    await createPost({
      authorId: glamgal.id,
      title: "So Glam",
      content:
        "When I see the word Glam, I think of Gary Glitter, David Bowie, and T-Rex.",
    });
  } catch (error) {
    throw error;
  }
};

const rebuildDB = async () => {
  try {
    client.connect();

    await dropTables();
    await createTables();
    console.log("...createInitialUsers");
    await createInitialUsers();
    console.log("...createInitialPosts");
    await createInitialPosts();
  } catch (error) {
    console.error(error);
  }
};

const testDB = async () => {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result: ", users);

    console.log("Calling updateUser on users[0]");
    const {
      rows: [user],
    } = await updateUser(users[0].id, {
      name: "Newname Sogod",
      location: "Lesterville, KY",
    });
    console.log("Results: ", user);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result: ", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result: ", updatePostResult.rows);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Finished database testing!");
  } catch (error) {
    console.log("Error testing database!");
    console.error(error);
  } finally {
    // it's important to close out the client connection
    client.end();
  }
};

const seeding = async () => {
  await rebuildDB();
  await testDB();
};

seeding();
