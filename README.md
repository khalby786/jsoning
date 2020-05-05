*Under construction*

---

# jsoning

A simple key-value JSON-based persistant lightweight database.

## Install

```js
npm install jsoning
```

## Basic Usage

```js
let db = require('jsoning');

let database = new db("/home/khalby786/Documents/jsoning/database.json");

database.set("en", "db");
database.set("foo", "bar");
database.set("chro", "venter");

let all = database.all();
console.log(all); // {"en":"db","foo":"bar","chro":"venter"}
```

### Jsoning#set

If key exists, value is updated, else a new key-value entry is made.

```js
let database = new db("database.json");

database.set("foo", "bar"); // returns true

let set = database.set("hi", "hello");
console.log(set); // also returns true
```

### Jsoning#all

Gets all the exisiting key-value pair of the JSON database.

```js
let database = new db("database.json");

let all = database.all();
console.log(all); // {"foo":"bar","hi":"hello"}
```