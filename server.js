// // developer dependencies
// const express = require("express");
// const app = express();

// app.use(express.json());

const fs = require("fs");
var db = require('/app/database.json');

module.exports = {
  
  set: function(key, value) {
    console.log(db);
    db[key] = value;
    fs.writeFile("database.json", JSON.stringify(db), function(err) {
      if (err) throw err;
      console.log("Written!");
    });
    console.log("Value successfully set");
  },
  
  get: function(key) {
    let data = fs.readFileSync("database.json");
    data = JSON.stringify(data);
    return data.value;
  },
  
  all: function() {
    let data = fs.readFileSync("database.json");
    data = JSON.parse(data);
    return data;
  },
  
  delete: function() {
    // not yet
  }
  
};

// app.get("/db", (req, res) => {
//   res.sendFile(__dirname + "/database.json");
// })

// app.listen(process.env.PORT, function() {
//   console.log(`Listening carefully on port ${process.env.PORT}`);
// });
