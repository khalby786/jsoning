*Under construction*

---

# jsoning

A simple key-value JSON-based persistent lightweight database.

[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Watchers](https://badgen.net/github/watchers/khalby786/jsoning)]
(https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![License](https://img.shields.io/npm/l/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)

| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

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