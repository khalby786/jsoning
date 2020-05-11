*Under construction*

---

# jsoning

[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![License](https://img.shields.io/npm/l/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)

| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |                        | ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

![jsoning](https://cdn.glitch.com/a1686874-cbbf-4ca9-b412-cd53a73b9ceb%2Fjsoning.png?v=1589118392848)

A simple key-value JSON-based persistent lightweight database. It uses JSON files to modify and write key-value elements as JSON-objects. Recommended for small-scale data stores.

**This package is in heavy WIP. While basic functions work, it is required to not to use this database to store sensitive info, for now.**

## Install

**Node.js v12.x or greater is required.**

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

## Links

* [GitHub](https://github.com/khalby786/jsoning)
* [Discord](https://discord.gg/3v8P9RE)
* [Glitch](https://glitch.com/~jsoning)

---

If you like to support my projects, consider buying me a coffee at [https://www.buymeacoffee.com/khaleelgibran](https://www.buymeacoffee.com/khaleelgibran).