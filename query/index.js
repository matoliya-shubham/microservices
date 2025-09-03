const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvents = (type, data) => {
  if (type === "PostCreated") {
    posts[data.id] = { id: data.id, title: data.title, comments: [] };
  }

  if (type === "CommentCreated") {
    posts[data.postId].comments.push({
      id: data.id,
      content: data.content,
    });
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;
    const comments = posts[postId].comments || [];
    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;
    comment.content = content;
  }
};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);
  const { type, data } = req.body;
  handleEvents(type, data);
  res.send({});
});

app.listen(4002, async () => {
  console.log("Query service is running on port 4002");

  const res = await axios.get("http://localhost:4005/events");

  for (let event of res.data) {
    console.log("Processing event:", event.type);
    handleEvents(event.type, event.data);
  }
});
