const express = require("express");
const cors = require("cors");
const { faker } = require("@faker-js/faker");

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());

function generatePosts(count) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    author_id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    avatar: faker.image.avatar(),
    image: faker.image.url(),
    created: faker.date.past().getTime(),
  }));
}

function generateComments(postId, count) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    post_id: postId,
    author_id: faker.string.uuid(),
    author: faker.person.fullName(),
    avatar: faker.image.avatar(),
    content: faker.lorem.sentence(),
    created: faker.date.past().getTime(),
  }));
}

app.get("/posts/latest", (_, res) => {
  const posts = generatePosts(1);
  res.json({
    status: "ok",
    data: posts,
  });
});

app.get("/posts/:postId/comments/latest", (req, res) => {
  const { postId } = req.params;
  const comments = generateComments(postId, 2);
  res.json({
    status: "ok",
    data: comments,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
