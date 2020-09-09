const test = require("ava");

const jsoning = require('../src/server');
const db = new jsoning('db.json');


test("Jsoning#set", async (t) => {
    t.is(await db.set("foo", "bar"), true);
});

test("Jsoning#push - new element", async (t) => {
    t.is(await db.push("bar", "bar"), true);
});

test("Jsoning#all", async (t) => {
    t.truthy(await db.all());
});

test("Jsoning#clear", async (t) => {
    t.truthy(await db.clear());
});

test("Jsoning#push - already existing element", async (t) => {
    t.is(await db.push("bar", "foo"), true);
});

test("Jsoning#get", async (t) => {
    t.notDeepEqual(await db.get("bar"), ["bar", "foo"])
});

test("Jsoning#math", async (t) => {
    await db.set("number", 300);
    t.is(await db.math("number", "add", 300), true)
});

test("Jsoning#has - deliberate false", async (t) => {
    t.is(await db.has("khaleel"), false);
});

test("Jsoning#has - existing element", async (t) => {
    t.is(await db.has("bar"), false);
});
