require("dotenv").config();
const amqp = require("amqplib/callback_api");

const { sendEmail } = require("./services/consumer/EmailService");
const { updateEmail } = require("./services/consumer/DBService");

const CONN_URL = process.env.MQ_URL;

amqp.connect(CONN_URL, (err, conn) => {
  conn.createChannel((err, ch) => {
    ch.consume(
      "emails",
      async msg => {
        console.log(".....");
        console.log("Handling Mongo ID: ", msg.content.toString());
        sendEmail(msg.content.toString())
          .then(sent => {
            if (sent) ch.ack(msg);
          })
          .catch(err => {
            console.error("Didnt send email ", err);
            updateEmail(msg.content.toString(), {
              sent: false,
              sentAt: moment().format(),
              error: "Not categorized error. Check logs"
            });
          });
      },
      { noAck: false }
    );
  });
});
