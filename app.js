import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ObjectID } from "mongodb";

import { publishToQueue } from "./services/producer/MQService";
import { getAll } from "./helpers/QueryHelper";
import moment from "moment";

const CONN_URL = process.env.DB_URL;
let mongoClient = null;

MongoClient.connect(CONN_URL, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    console.log(err);
  } else {
    mongoClient = client;
  }
});

let app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
  req.db = mongoClient.db("spv-mailer");
  next();
});

app.post("/send", async (req, res, next) => {
  let { queueName, payload } = req.body;

  const { insertedId } = await req.db.collection("emails").insertOne({
    ...payload,
    queuedAt: moment().format(),
    sentTimes: 0
  });
  await publishToQueue(queueName, insertedId.toString());
  res.statusCode = 200;
  res.data = { id: insertedId.toString() };
  next();
});

// app.get("/status", async (req, res, next) => {
//   const id = req.query.id;
//   const email = await req.db
//     .collection("emails")
//     .findOne({ _id: { $eq: ObjectID(id) } });
//   res.statusCode = 200;
//   res.data = email;
//   next();
// });

app.get("/emails/:id", async (req, res, next) => {
  const id = req.params.id;
  const email = await req.db
    .collection("emails")
    .findOne({ _id: { $eq: ObjectID(id) } });
  res.statusCode = 200;
  res.data = email;
  next();
});

app.get("/emails", async (req, res, next) => {
  const emails = await getAll(req.db.collection("emails"), req.query);
  res.statusCode = 200;
  res.data = emails;
  next();
});

app.use((req, res, next) => {
  if (!res.data) {
    return res.status(404).send({
      status: false,
      error: {
        reason: "Invalid Endpoint",
        code: 404
      }
    });
  }

  res.status(res.statusCode || 200).send(res.data);
});

app.listen(30006, () => {
  console.log(" ********** : running on 30006");
});

process.on("exit", code => {
  mongoClient.close();
  console.log(`About to exit with code: ${code}`);
});

process.on("SIGINT", function() {
  console.log("Caught interrupt signal");
  process.exit();
});

module.exports = app;
