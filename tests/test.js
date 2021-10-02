const test = require("ava");

const jsoning = require("../src/jsoning.js");

test("Jsoning#set", async (t) => {
  const db = new jsoning("./tests/test1.test.json");
  t.is(await db.set("foo", "bar"), true);
});

test("Jsoning#clear", async (t) => {
  const db = new jsoning("./tests/test2.test.json");
  await db.set("foo", "bar");
  t.truthy(await db.clear());
});

test("Jsoning#push - new element", async (t) => {
  const db = new jsoning("./tests/test3.test.json");
  t.is(await db.push("bar", "bar"), true);
});

test("Jsoning#all", async (t) => {
  const db = new jsoning("./tests/test4.test.json");
  await db.push("bar", "bar");
  t.truthy(await db.all());
});

test("Jsoning#push - already existing element", async (t) => {
  const db = new jsoning("./tests/test5.test.json");
  await db.push("bar", "bar");
  t.is(await db.push("bar", "foo"), true);
});

test("Jsoning#remove - existing element", async (t) => {
  const db = new jsoning("./tests/test10.test.json");
  await db.set("removeArea", ["a", "b", "a"]);
  t.is(await db.remove("removeArea", "a"), true);
  t.deepEqual(await db.get("removeArea"), ["b"]);
});

test("Jsoning#remove - non-existent element", async (t) => {
  const db = new jsoning("./tests/test11.test.json");
  await db.set("removeArea", ["a", "b", "a"]);
  t.is(await db.remove("removeArea", "c"), true);
  t.deepEqual(await db.get("removeArea"), ["a", "b", "a"]);
});

test("Jsoning#remove - non-existent key", async (t) => {
  const db = new jsoning("./tests/test12.test.json");
  t.is(await db.remove("noRemoveArea", "a"), true);
  t.is(await db.has("noRemoveArea"), false);
});

test("Jsoning#remove - non-array key", async (t) => {
  const db = new jsoning("./tests/test13.test.json");
  await db.set("nonArray", "no touching");
  t.is(await db.remove("nonArray", "a"), false);
  t.is(await db.get("nonArray"), "no touching");
});

test("Jsoning#get", async (t) => {
  const db = new jsoning("./tests/test6.test.json");
  await db.push("bar", "bar");
  t.deepEqual(await db.get("bar"), ["bar"]);
});

test("Jsoning#math", async (t) => {
  const db = new jsoning("./tests/test7.test.json");
  await db.set("number", 300);
  t.is(await db.math("number", "add", 300), true);
});

test("Jsoning#has - deliberate false", async (t) => {
  const db = new jsoning("./tests/test8.test.json");
  t.is(await db.has("khaleel"), false);
});

test("Jsoning#has - existing element", async (t) => {
  const db = new jsoning("./tests/test9.test.json");
  // await db.clear();
  await db.push("bar", "pog");
  t.is(await db.has("bar"), true);
});
