const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());
app.use(cors());

// we will store all posts created inside posts object for now
const posts = {};

app.get("/posts", (req, res) => {
  try {
    res.status(200).send(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({ status: "Error", message: "Failed to fetch posts" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).send({
        status: "Error",
        message: "Title and content are required",
      });
    }

    const id = randomBytes(4).toString("hex");
    const post = { id, title, content };
    posts[id] = post;

    try {
      await axios.post("http://event-bus-srv:4005/events", {
        type: "PostCreated",
        data: post,
      });
    } catch (err) {
      console.error("Failed to emit PostCreated event:", err.message);
      // Don't fail the request if event emission fails
    }

    res.status(201).send(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send({ status: "Error", message: "Failed to create post" });
  }
});

app.post("/events", (req, res) => {
  try {
    console.log("Received Event", req.body.type);
    res.status(200).send({ status: "OK" });
  } catch (error) {
    console.error("Error processing event:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to process event" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Posts service is running on port ${PORT}`);
});
