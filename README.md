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