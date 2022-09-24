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
  getPostsByUser,
  createTags,
  addTagsToPost,
  getPostById,
  getPostsByTagName,
} = require("./index");

// this function calls a query to drop all tables from our database
const dropTables = async () => {
  try {
    console.log("Starting to drop tables...");
    await client.query(`
      DROP TABLE IF EXISTS post_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS posts;
      DROP TABLE IF EXISTS users;
    `);
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
    await client.query(`
        CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
    );`);

    console.log("...building posts table");
    await client.query(`
            CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );`);

    console.log("...building tags table");
    await client.query(`
        CREATE TABLE tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL
        );
    `);

    console.log("...building through table for posts_tags");
    await client.query(`
        CREATE TABLE post_tags (
          "postId" INT REFERENCES posts(id),
          "tagId" INT REFERENCES tags(id),
          UNIQUE("postId", "tagId")
        );
    `);

    console.log("Finished building tables!");
  } catch (error) {
    console.log("Error building tables!");
    throw error; // pass the error up to the function that calls createTables
  }
};

const createInitialUsers = async () => {
  try {
    console.log("Starting to create users...");
    await createUser({
      username: "albert",
      password: "bertie99",
      name: "albert",
      location: "omaha, ne",
    });
    await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "sandy",
      location: "philadelphia, pa",
    });
    await createUser({
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
      tags: ["#happy", "#youcandoanything"],
    });

    await createPost({
      authorId: sandra.id,
      title: "Having Fun",
      content:
        "I am definitely confused, but I am still having fun creating my first database.",
      tags: ["#happy", "#worstdayever"],
    });

    await createPost({
      authorId: glamgal.id,
      title: "So Glam",
      content:
        "When I see the word Glam, I think of Gary Glitter, David Bowie, and T-Rex.",
      tags: ["#neverenoughglam", "#doyouevenglam"],
    });
    console.log("Finished creating posts!");
  } catch (error) {
    console.log("Error creating posts!");
    throw error;
  }
};

const createInitialTags = async () => {
  try {
    console.log("Starting to create tags...");

    const [happy, sad, inspo, catman] = await createTags([
      "#happy",
      "#worst-day-ever",
      "#youcandoanything",
      "#catmandoeverything",
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);

    console.log("Finished creating Tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
};

const rebuildDB = async () => {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    // await createInitialTags();
  } catch (error) {
    console.error("Error during rebuildDB");
    throw error;
  }
};

const testDB = async () => {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result: ", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogod",
      location: "Lesterville, KY",
    });
    console.log("Results: ", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result: ", posts);

    console.log("Calling updatePost on posts[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "New Title",
      content: "Updated Content",
    });
    console.log("Result: ", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Calling getPostsByUser with 1");
    const userPosts = await getPostsByUser(1);
    console.log("Result: ", userPosts);

    console.log("Calling getPostById with 1");
    const post = await getPostById(1);
    console.log("Result: ", post);

    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"],
    });
    console.log("Result: ", updatePostTagsResult);

    console.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);

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
