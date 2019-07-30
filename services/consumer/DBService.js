const { MongoClient } = require("mongodb");
var ObjectID = require("mongodb").ObjectID;

const CONN_URL = process.env.DB_URL;

let db = null;

MongoClient.connect(CONN_URL, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    console.log(err);
  } else {
    db = client.db("spv-mailer");
  }
});

const updateEmail = (id, emailStatus) => {
  db.collection("emails").updateOne(
    { _id: ObjectID(id) },
    { $set: emailStatus }
  );
};

const getEmail = id => {
  return db.collection("emails").findOne({ _id: { $eq: ObjectID(id) } });
};

module.exports = {
  updateEmail,
  getEmail
};
