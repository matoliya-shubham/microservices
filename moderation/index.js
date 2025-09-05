const express = require("express");
const bodyParser = require("body-parser");
const { randomBytes } = require("crypto");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());

// we will store all posts created inside posts object for now
const posts = {};

app.post("/events", async (req, res) => {
  try {
    console.log("Received Event for Moderation", req.body.type);
    const { type, data } = req.body;

    if (type === "CommentCreated") {
      const status = data.content.includes("orange") ? "rejected" : "approved";

      try {
        await axios.post("http://event-bus-srv:4005/events", {
          type: "CommentModerated",
          data: { ...data, status },
        });
      } catch (err) {
        console.error("Failed to emit CommentModerated event:", err.message);
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

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Moderation service is running on port ${PORT}`);
});
