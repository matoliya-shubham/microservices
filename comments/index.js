const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());
app.use(cors());

// we will store all posts created inside posts object for now
const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  try {
    res.send(commentsByPostId[req.params.id] || []);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to fetch comments" });
  }
});

app.post("/posts/:id/comments", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).send({
        status: "Error",
        message: "Content is required",
      });
    }

    const commentId = randomBytes(4).toString("hex");
    const comments = commentsByPostId[req.params.id] || [];
    const newComment = { id: commentId, content, status: "pending" };
    comments.push(newComment);
    commentsByPostId[req.params.id] = comments;

    try {
      await axios.post("http://event-bus-srv:4005/events", {
        type: "CommentCreated",
        data: { ...newComment, postId: req.params.id },
      });
    } catch (err) {
      console.error("Failed to emit CommentCreated event:", err.message);
    }

    res.status(201).send(comments);
  } catch (error) {
    console.error("Error creating comment:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to create comment" });
  }
});

app.post("/events", async (req, res) => {
  try {
    console.log("Received Event from event bus", req.body.type);
    const { type, data } = req.body;

    if (type === "CommentModerated") {
      const { id, content, postId, status } = data;
      const comments = commentsByPostId[postId] || [];
      const comment = comments.find((c) => c.id === id);
      if (comment) {
        comment.status = status;

        try {
          await axios.post("http://event-bus-srv:4005/events", {
            type: "CommentUpdated",
            data: { id, content, postId, status },
          });
        } catch (err) {
          console.error("Failed to emit CommentUpdated event:", err.message);
        }
      }
    }
    res.send({});
  } catch (error) {
    console.error("Error processing event:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to process event" });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Comments service is running on port ${PORT}`);
});
