*Under construction*

---

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

**Node.js v12.x or greater is required.**

```js
npm install jsoning
```

View the full documentation [here](https://khalby786.github.io/jsoning).

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
* [Documentation](https://khalby786.github.io/jsoning)

---

If you would like to support my projects, consider buying me a donut at [https://www.buymeacoffee.com/khaleelgibran](https://www.buymeacoffee.com/khaleelgibran).