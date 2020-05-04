// developer dependencies
const express = require("express");
const app = express();

const fs = require("fs");
var db = require('database.json');

module.exports = {
  
  
  set: function(key, value) {
    try {
      db.key;
    } catch {
      throw new Error("Key already exists!")
    }
    let data = { key: key, value: value };
    
    fs.appendFile("database.json", )
    console.log("Value successfully set");
  }
  
};

app.listen(process.env.PORT, function() {
  console.log(`Listening carefully on port ${process.env.PORT}`);
});
