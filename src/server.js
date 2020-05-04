// // developer dependencies
// const express = require("express");
// const app = express();

// app.use(express.json());

const fs = require("fs");
// var path = require('path');
// var jsoning = require( path.resolve( __dirname, "./jsoning.js" ) );
const jsoning = require(__dirname + '/jsoning.js');

module.exports = jsoning;

// app.get("/db", (req, res) => {
//   res.sendFile(__dirname + "/database.json");
// })

// app.listen(process.env.PORT, function() {
//   console.log(`Listening carefully on port ${process.env.PORT}`);
// });
