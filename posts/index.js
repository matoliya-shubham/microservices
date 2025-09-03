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
  res.send(posts);
});
//

app.post("/posts", async (req, res) => {
  const { title, content } = req.body;
  const id = randomBytes(4).toString("hex");
  posts[id] = { id, title, content };

  await axios.post("http://localhost:4005/events", {
    type: "PostCreated",
    data: { id, title, content },
  });

  res.status(201).send(posts[id]);
});

app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);
  res.send({});
});

app.listen(4000, () => {
  console.log("Posts service is running on port 4000");
});
