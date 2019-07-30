import amqp from "amqplib/callback_api";
const CONN_URL = process.env.MQ_URL;

let ch = null;
amqp.connect(CONN_URL, (err, conn) => {
  conn.createChannel((err, channel) => {
    ch = channel;
  });
});

export const publishToQueue = async (queueName, data) => {
  ch.sendToQueue(queueName, Buffer.alloc(data.length, data), {
    persistent: true
  });
};

process.on("exit", code => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});
