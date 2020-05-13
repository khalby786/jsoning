const test = require("ava");
const jsoning = require("../src/server.js");

// new database
const database = new jsoning("db.json");

test("new database", (t) => {
  let db = new jsoning("hello.json");
  t.is(db.set("foo", "bar"), true, "new database!!!");
});

test("test started", (t) => {
  t.pass();
});

test("value set should return true", (t) => {
  t.is(database.set("khaleel", "gibran"), true, "Jsoning#set successful!");
});

test("value all should return all", (t) => {
  t.deepEqual(database.all(), { khaleel: "gibran" }, "Jsoning#all successful!");
});

test("value get should return existing element", (t) => {
  t.is(database.get("khaleel"), "gibran", "Jsoning#get successful!");
});

test("value delete should return delete", (t) => {
  t.is(database.delete("khaleel"), true, "Jsoning#delete successful!");
});

test("value delete should return false for non-existing element", (t) => {
  t.is(
    database.delete("wakanda"),
    false,
    "Jsoning#delete false test successful!"
  );
});

test("value get should return false for non-existing element", (t) => {
  t.is(database.get("wakanda"), false, "Jsoning#get false test successful!");
});

test("clear should clear everything", (t) => {
  database.set("foo", "bar");
  database.set("hi", "hello");
  database.set("en", "db");
  t.is(database.clear(), true, "Cleared successfully!");
});

test("#set empty", (t) => {
  const error = t.throws(
    () => {
      database.set("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#set not string", (t) => {
  const error = t.throws(
    () => {
      database.set(3, "hi");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#delete empty", (t) => {
  const error = t.throws(
    () => {
      database.delete("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#delete not string", (t) => {
  const error = t.throws(
    () => {
      database.delete(3);
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("#get empty", (t) => {
  const error = t.throws(
    () => {
      database.get("");
    },
    { instanceOf: TypeError },
    "error thrown!"
  );
});

test("invalid db file", (t) => {
    const error = t.throws(
      () => {
        const jsondb = new jsoning("example")
      },
      { instanceOf: TypeError },
      "error thrown!"
    );
  });