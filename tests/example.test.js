const jsoning = require("../src/jsoning.js");
const db = new jsoning("../src/db.json");

(async () => {
//   await db.set("testArray", null);

//   console.log(await db.all());

//   await db.set("testArray", []);

//   console.log(await db.all());
//   await db.push("testArray", "hello");
//   await db.push("testArray", "world");
//   await db.push("testArray", ["hello"]);
//   await db.push("testArray", undefined);
//   await db.push("testArray", null);
//   await db.push("testArray", 3);
//   await db.push("testArray", { "hello": "world" });
await db.clear();

})();
