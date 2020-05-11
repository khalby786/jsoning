const test = require('ava');
const jsoning = require("../src/server.js");

// new database
const database = new jsoning("db.json");

test("test started", t => {
    t.pass();
})

test("value set should return true", t => {
    t.is(database.set("khaleel", "gibran"), true, "Jsoning#set successful!");
});

test("value all should return all", t => {
    t.deepEqual(database.all(), {"khaleel":"gibran"}, "Jsoning#all successful!");
});

test("value get should return existing element", t => {
    t.is(database.get("khaleel"), "gibran", "Jsoning#get successful!");
});

test("value delete should return delete", t => {
    t.is(database.delete("khaleel"), true, "Jsoning#delete successful!");
});

test("value delete should return false for non-existing element", t => {
    t.is(database.delete("wakanda"), false, "Jsoning#delete false test successful!");
});

test("value get should return false for non-existing element", t => {
    t.is(database.get("wakanda"), false, "Jsoning#get false test successful!");
});