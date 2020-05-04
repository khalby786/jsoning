// developer dependencies
const express = require("express");
const app = express();

const fs = require("fs");

module.exports = {
  new: function(key) {
    // fs.readFile("database.json", function(err, data) {
    //   if (err) throw err;
    //   const 
    // })
    const db = require('database.json');
    console.log(db);
    
    // see if it exists
    try {
      
    } catch {
      
    }
    fs.appendFile(
      "database.json",
      `
      ${key} {

      }
      `,
      function(err) {
        if (err) throw err;
        console.log("saved!");
      }
    );
  }
};

app.listen(process.env.PORT, function() {
  console.log(`Listening carefully on port ${process.env.PORT}`);
});
