*This documentation and this package is currently under development.*

---

#### Table of Contents

[[toc]]

# jsoning

![CodeCov](https://codecov.io/gh/khalby786/jsoning/branch/master/graph/badge.svg)
[![Build Status](https://travis-ci.org/khalby786/jsoning.svg?branch=master)](https://travis-ci.org/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![License](https://img.shields.io/npm/l/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)
![Pkgreview.dev Reviews](https://img.shields.io/pkgreview/rating/npm/jsoning)
![Pkgreview.dv Stars](https://img.shields.io/pkgreview/stars/npm/jsoning)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/jsoning)
![Discord](https://img.shields.io/discord/698841420412354581)
![npm bundle size](https://img.shields.io/bundlephobia/min/jsoning)
![GitHub repo size](https://img.shields.io/github/repo-size/khalby786/jsoning)
![node-current](https://img.shields.io/node/v/jsoning)
![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fkhalby786.github.io%2Fjsoning)

![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fkhalby786.github.io%2Fjsoning)
![Twitter Follow](https://img.shields.io/twitter/follow/khalby786?style=social)


| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |             
| ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

![jsoning](https://cdn.glitch.com/c393fad9-338a-43b4-9a2f-8ba07e26d39d%2Fjsoning.png?v=1589190601684)

A simple key-value JSON-based persistent lightweight database. It uses JSON files to modify and write key-value elements as JSON-objects. Recommended for small-scale data stores.

**This package is in heavy WIP. While basic functions work, it is recommended not to use this database package to store sensitive info, for now.**

## Install

**Node.js v12.x or greater is required for this package to work.**

```js
npm install jsoning
```

View the full documentation [here](/jsoning).

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
## Jsoning Constructor

Create a new JSON database or initialize an exisiting database.

### Parameters

| Type | Name | Description |
|------|------|-------------|
| string | database | The name of the JSON database to be created or used. |

### Returns

| Type | Description |
|------|-------------|
| Boolean | Whether an existing JSON file was used or created or the action failed. |

### Example

```js
const jsoning = require('jsoning');
var database = new jsoning("database.json");
```

::: warning
Make sure **not** to include directory paths for the new database argument (like `dir/db.json`). Use file names only instead (like `db.json` and `hello.json`).
:::


## Methods

---

### Jsoning#all

Returns all the elements and their values of the JSON database.

#### Returns

| Type | Description |
|------|-------------|
| Object | The object of all the key-value pairs of the database. |

#### Example

```js
let all = database.all();
console.log(all); // { "foo": "bar", "hi": "hello" }
```

---

### Jsoning#clear

Clears the whole JSON database.

#### Returns

| Type | Description |
|------|-------------|
| Boolean | Whether the database was cleared or not. |

#### Example

```js
database.set("foo", "bar");
database.set("en", "db");

database.clear(); // return {}
```

---

### Jsoning#delete

Deletes an element from the database based on its key.

#### Parameters

| Type | Name | Description |
|------|------|-------------|
| string | key | The key of the element to be deleted. |

#### Returns

| Type | Description |
|------|-------------|
| Boolean | Returns true if the value is deleted, else returns false. |

#### Example

```js
database.set("ping", "pong");
database.set("foo", "bar");

database.delete("foo"); // returns true
```

---

### Jsoning#get 

Gets the value of an element based on it's key.

#### Parameters

| Type | Name | Description |
|------|------|-------------|
| string | key | The key of the element to be fetched. |

#### Returns

| Type | Description |
|------|-------------|
| * | Returns value, if element exists, else returns false. |


#### Example

```js
database.set("food", "pizza");

let food = database.get("food");
console.log("food") // returns pizza
```

---


## Links

* [GitHub](https://github.com/khalby786/jsoning)
* [Discord](https://discord.gg/3v8P9RE)
* [Glitch](https://glitch.com/~jsoning)
* [NPM](https://npmjs.org/jsoning)

## Contributors

* [Khaleel Gibran](https://khaleelgibran.com) 
* [chroventer](https://github.com/chroventer)

## Versioning

This package follows Semantic Versioning. Current version is v`0.3.9`.

### To-do

* Prevent JSON corruption
* Error handling

---

If you would like to support my projects, consider buying me a donut at [https://www.buymeacoffee.com/khaleelgibran](https://www.buymeacoffee.com/khaleelgibran).