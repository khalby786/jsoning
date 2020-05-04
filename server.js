// developer dependencies
const express = require("express");
const app = express();

app.use(express.json());

const fs = require("fs");
var db = require('/app/database.json');

module.exports = {
  
  set: function(key, value) {
    try {
      db.key;
    } catch {
      throw new Error("Key already exists!")
    }
    let data = { key: key, value: value };
    data = JSON.stringify(data);
    fs.appendFileSync("database.json", data)
    console.log("Value successfully set");
  },
  
  get: function(key) {
    let data = fs.readFileSync("database.json");
    data = JSON.stringify(data);
    return data.value;
  },
  
  all: function() {
    let data = fs.readFileSync("database.json");
    data = JSON.stringify(data);
    return data;
  }
  
};

app.listen(process.env.PORT, function() {
  console.log(`Listening carefully on port ${process.env.PORT}`);
});
