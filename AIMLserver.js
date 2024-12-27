const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const cors=require("cors")

const app = express();
app.use(bodyParser.json());
app.use(cors());

const RABBITMQ_URL = "amqps://tkmzwfdi:L8M8wKlnoUA37hyz1GRrlch8ufJY3mys@fuji.lmq.cloudamqp.com/tkmzwfdi";
const QUEUE_NAME = "user_actions";

// Connect to RabbitMQ
const connectToQueue = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL, {
            protocol: "amqps",  // Ensure using the correct AMQP protocol
            tls: true  // Explicitly enable TLS
        });        
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: false });
        console.log("Connected to RabbitMQ");
        return channel;
    } catch (error) {
        console.error("RabbitMQ connection failed:", error);
        process.exit(1);
    }
};

// Initialize RabbitMQ channel
let channel;
connectToQueue().then((ch) => (channel = ch));

// Endpoint to send messages to RabbitMQ
app.post("/api/send-event", async (req, res) => {
    try {
        const message = req.body;
        if (!channel) {
            return res.status(500).json({ error: "RabbitMQ channel not initialized" });
        }

        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)));
        console.log("Message sent to queue:", message);
        res.status(200).json({ message: "Event sent to queue successfully" });
    } catch (error) {
        console.error("Error sending message to queue:", error);
        res.status(500).json({ error: "Failed to send event to queue" });
    }
});

// Start the server on port 6000
const port = process.env.PORT||4000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
