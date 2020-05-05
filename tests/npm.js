const Jsoning = require("jsoning");

let db = new Jsoning("/test/test.json");

// set a value
db.set("en", "db");
db.set("khaleel", "gibran");

let all = db.all();
console.log(all);