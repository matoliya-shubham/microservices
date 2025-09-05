const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.use(bodyParser.json());

const events = [];

app.post("/events", async (req, res) => {
  const event = req.body;
  console.log("Received Event by event bus", event.type);

  try {
    events.push(event);

    // Emit event to all services
    await Promise.allSettled([
      axios
        .post("http://posts-clusterip-srv:4000/events", event)
        .catch((err) =>
          console.error("Error sending to posts service:", err.message)
        ),
      axios
        .post("http://comments-clusterip-srv:4001/events", event)
        .catch((err) =>
          console.error("Error sending to comments service:", err.message)
        ),
      axios
        .post("http://query-clusterip-srv:4002/events", event)
        .catch((err) =>
          console.error("Error sending to query service:", err.message)
        ),
      axios
        .post("http://moderation-clusterip-srv:4003/events", event)
        .catch((err) =>
          console.error("Error sending to moderation service:", err.message)
        ),
    ]);

    res.status(200).send({ status: "Event processed" });
  } catch (error) {
    console.error("Error processing event:", error);
    res.status(500).send({ status: "Error", message: error.message });
  }
});

app.get("/events", (req, res) => {
  try {
    res.status(200).send(events);
  } catch (error) {
    console.error("Error retrieving events:", error);
    res
      .status(500)
      .send({ status: "Error", message: "Failed to retrieve events" });
  }
});

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`Event Bus is running on port ${PORT}`);
});
