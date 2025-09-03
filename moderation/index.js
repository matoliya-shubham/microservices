const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());

// we will store all posts created inside posts object for now
const posts = {};

app.post("/events", async (req, res) => {
  console.log("Received Event for Moderation", req.body.type);
  const { type, data } = req.body;
  if (type === "CommentCreated") {
    const status = data.content.includes("orange") ? "rejected" : "approved";
    await axios.post("http://localhost:4005/events", {
      type: "CommentModerated",
      data: { id: data.id, content: data.content, postId: data.postId, status },
    });
  }
  res.send({});
});

app.listen(4003, () => {
  console.log("Moderation service is running on port 4003");
});
