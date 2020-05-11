*Under construction*

---

# jsoning

A simple key-value JSON-based persistent lightweight database.

[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![License](https://img.shields.io/npm/l/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)

| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

![jsoning](https://cdn.glitch.com/a1686874-cbbf-4ca9-b412-cd53a73b9ceb%2Fjsoning.png?v=1589118392848)

## Install

```js
npm install jsoning
```

## Basic Usage

```js
let jsoning = require('jsoning');
let database = new jsoning("database.json");

database.set("en", "db");
database.set("foo", "bar");
database.set("chro", "venter");

let all = database.all();
console.log(all); // {"en":"db","foo":"bar","chro":"venter"}
```

### Jsoning#set

If key exists, value is updated, else a new key-value entry is made.

```js
let database = new jsoning("database.json");

database.set("foo", "bar"); // returns true

let set = database.set("hi", "hello");
console.log(set); // also returns true
```

### Jsoning#all

Gets all the exisiting key-value pair of the JSON database.

```js
let database = new jsoning("database.json");

let all = database.all();
console.log(all); // {"foo":"bar","hi":"hello"}
```

### Jsoning#get

Returns the value of an existing element in a database. 

```js
let database = new jsoning("database.json");

// set a value
database.set("khaleel", "gibran");

// get value
let value = database.get("khaleel");
console.log(value); // returns 'gibran'
```

### Jsoning#delete

Delete an existing element from the database and returns true if the event takes place.

```js
let database = new jsoning("database.json");

// set a value to be delete
database.set("ping", "pong");

// delete ping
let del = database.delete("ping");
console.log(del); // returns true
```

---

If you like to support my projects, consider buying me a coffee at [https://www.buymeacoffee.com/khaleelgibran](https://www.buymeacoffee.com/khaleelgibran).