const test = require("ava");
const jsoning = require("../src/server.js");

// new database
const database = new jsoning("db.json");

test("new database", async (t) => {
  let db = new jsoning("hello.json");
  t.is(await db.set("foo", "bar"), true, "new database!!!");
});

test("test started", async (t) => {
  t.pass();
});

test("value set should return true", async (t) => {
  t.is(await database.set("khaleel", "gibran"), true, "Jsoning#set successful!");
});

test("set boolean", async (t) => {
  let type = new jsoning("type.json");
  t.is(await type.set('bool', true), true, "boolean!");
  t.is(await type.set('number', 3), true, "number!!!");
  t.is(await type.set('object', { "hi": "another hello" }), true, "object!!!");
});

test("value all should return all", async (t) => {
  console.log(await database.all());
  t.deepEqual(await database.all(), { khaleel: "gibran" }, "Jsoning#all successful!");
});

test("value get should return existing element", async (t) => {
  t.is(await database.get("khaleel"), "gibran", "Jsoning#get successful!");
});

test("value delete should return delete", async (t) => {
  t.is(await database.delete("khaleel"), true, "Jsoning#delete successful!");
});

test("value delete should return false for non-existing element", async (t) => {
  t.is(
    await database.delete("wakanda"),
    false,
    "Jsoning#delete false test successful!"
  );
});

test("value get should return false for non-existing element", async (t) => {
  t.is(await database.get("wakanda"), false, "Jsoning#get false test successful!");
});

test("clear should clear everything", async (t) => {
  await database.set("foo", "bar");
  await database.set("hi", "hello");
  await database.set("en", "db");
  t.is(await database.clear(), true, "Cleared successfully!");
});

test("#set empty", async (t) => {
  const error = t.throwsAsync(
    async () => {
      await database.set("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#set not string", async (t) => {
  const error = t.throwsAsync(
    async () => {
      await database.set(3, "hi");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#delete empty", async (t) => {
  const error = t.throwsAsync(
    async () => {
      await database.delete("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#delete not string", async (t) => {
  const error = t.throwsAsync(
    async () => {
      await database.delete(3);
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#get empty", async (t) => {
  const error = t.throwsAsync(
    async () => {
      await database.get("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("invalid db file", async (t) => {
    const error = t.throws(
      async () => {
        const jsondb = new jsoning("example")
      },
      { instanceOf: TypeError },
      "error thrown!"
    );
  });

  test("Jsoning#math basic functions", async (t) => {
    await database.set("add", 1);
    await database.set("minus", 5);
    await database.set("into", 5);
    await database.set("by", 4);
    t.is(await database.math('add', 'add', 1), true, "Jsoning#math - add");
    t.is(await database.math('minus', 'subtract', 4), true, "Jsoning#math subtract passed!");
    t.is(await database.math('into', 'multiply', 3), true, "Jsoning#math - multiply")
    t.is(await database.math('by', 'divide', 2), true, "Jsoning#math - divide");
    t.is(await database.math('hisfdsd', 'fese', 2), false, "Jsoning#math - false!");
    // t.is(database.math("add", "some", "3"), false, "Jsoning#math false");
    // t.is(database.math("add", "add", "3"), false, "Jsoning#math false")
  });

test("Jsoning#has", async (t) => {
    t.is(await database.has("somevalueblahblah"), false, "Jsoning#has test false");
    t.is(await database.has("add"), true, "Jsoning#has test true");
});

test("fake keys", async (t) => {
    const error = t.throwsAsync(
    async () => {
      await database.math(3);
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("fake math operation", async (t) => {
    const error = t.throwsAsync(
    async () => {
      await database.math("3", 2, 2);
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("fake math operand", async (t) => {
    const error = t.throwsAsync(
    async () => {
      await database.math("3", "add", "2");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("throw errors and make this test successful", async (t) => {
    const error = t.throwsAsync(
    async () => {
      await database.math("khaleel", "add", "2");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("new array", async (t) => {
    t.is(await database.push("newarray", "3"), true, "new array true");
    const error = t.throwsAsync(
        async () => {
        await database.push("khaleel", "2");
        },
        { instanceOf: TypeError },
        "error thrown!"
    );
})