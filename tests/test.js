// developer dependencies
const express = require("express");
const app = express();

const db = require('../src/server.js');

let database = new db("/home/khalby786/Documents/jsoning/database.json");

let all = database.all();
console.log(all);

database.set("en", "db");
database.set("foo", "bar");
database.set("chro", "venter");

app.get("/db", (req, res) => {
  console.log(__dirname);
  res.sendFile("/app/database.json");
})

app.listen(process.env.PORT || 4000, function() {
  console.log(`Listening carefully on port ${process.env.PORT || 4000}`);
});
