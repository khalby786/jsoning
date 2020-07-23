const jsoning = require('../src/server.js');
const db = new jsoning('npm-test.json');

(async() => {

    await db.set("value1", "value1");
    await db.set("value2", "value2");

    await db.push("value3", "value3");
    await db.push("value3", "value4");
    await db.push("value3", "value5");

    console.log(await db.get("value3"));

    console.log(await db.all());

    console.log(await db.has("value2"));

    console.log(await db.delete("value2"));

    console.log(await db.has("value2"));

    await db.set("money", 100);
    await db.math("money", "add", 200);

    console.log(await db.get("money"));

    await db.clear();

})();