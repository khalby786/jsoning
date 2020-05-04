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

db.set("foo", "bar"); // returns true
db.set("en", "db"); // returns true

let all = db.all();
console.log(all); // { "foo": "bar", "en": "db" }
```