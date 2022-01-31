const jsoning = require("../src/jsoning.js");
const db = new jsoning("../dir1/dir2/dir3/dir4/../test.json");

(async () => {
  console.log(await db.all());
})();
