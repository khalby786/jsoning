// developer dependencies
// const express = require("express");
// const app = express();

const db = require('/app/server.js');

let all = db.all();
console.log(all);

db.set("en", "db");

// app.get("/db", (req, res) => {
//   console.log(__dirname);
//   res.sendFile("/app/database.json");
// })

// app.listen(process.env.PORT, function() {
//   console.log(`Listening carefully on port ${process.env.PORT}`);
// });
