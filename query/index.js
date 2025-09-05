const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvents = (type, data) => {
  try {
    if (type === "PostCreated") {
      posts[data.id] = { id: data.id, title: data.title, comments: [] };
    }

    if (type === "CommentCreated") {
      const post = posts[data.postId];
      if (post) {
        post.comments.push({
          id: data.id,
          content: data.content,
          status: data.status,
        });
      }
    }

    if (type === "CommentUpdated") {
      const { id, content, postId, status } = data;
      const post = posts[postId];
      if (post) {
        const comment = post.comments.find((c) => c.id === id);
        if (comment) {
          comment.status = status;
          comment.content = content;
        }
      }
    }
  } catch (error) {
    console.error(`Error handling event ${type}:`, error);
  }
};

app.get("/posts", (req, res) => {
  try {
    res.send(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({ status: "Error", message: "Failed to fetch posts" });
  }
});

app.post("/events", (req, res) => {
  try {
    console.log("Received Event", req.body.type);
    const { type, data } = req.body;
    handleEvents(type, data);
    res.send({});
  } catch (error) {
    console.error("Error processing event:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to process event" });
  }
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, async () => {
  console.log(`Query service is running on port ${PORT}`);

  try {
    const res = await axios.get("http://event-bus-srv:4005/events");

    for (let event of res.data) {
      console.log("Processing event:", event.type);
      handleEvents(event.type, event.data);
    }
  } catch (error) {
    console.error("Error fetching past events:", error.message);
  }
});
