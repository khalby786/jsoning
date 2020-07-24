![jsoning](https://cdn.glitch.com/53ed8404-b30d-494a-8960-e28bf8781ebd%2Fjsoning-text.png?v=1595495853462)

<div align="center">

# jsoning

✨ A simple key-value JSON-based persistent lightweight database. ✨

</div>

<div align="center">

![CodeCov](https://codecov.io/gh/khalby786/jsoning/branch/master/graph/badge.svg)
[![Build Status](https://travis-ci.org/khalby786/jsoning.svg?branch=master)](https://travis-ci.org/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)
![Pkgreview.dev Reviews](https://img.shields.io/pkgreview/rating/npm/jsoning)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/jsoning)
![Discord](https://img.shields.io/discord/698841420412354581)
![npm bundle size](https://img.shields.io/bundlephobia/min/jsoning)
![GitHub repo size](https://img.shields.io/github/repo-size/khalby786/jsoning)
![node-current](https://img.shields.io/node/v/jsoning)
![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fkhalby786.github.io%2Fjsoning)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_shield)

</div>

<div align="center">

![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fkhalby786.github.io%2Fjsoning)
![Twitter Follow](https://img.shields.io/twitter/follow/khalby786?style=social)

</div>

<div align="center">

[View Demo](https://glitch.com/edit/#!/jsoning) · [Report Bug](https://github.com/khalby786/jsoning/issues) · [Request Feature](https://github.com/khalby786/jsoning/issues)

Loved the project? Please consider [donating](https://buymeacoffee.com/khaleelgibran) to help it improve!

</div>


| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |             
| ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

## Features

* 📝 Uses JSON files to modify and write key-value elements as JSON-objects.
* 👌 **Easy to use** JSON database.
* 🚫 **Prevents JSON corruption** with [atomic file writing](https://github.com/npm/write-file-atomic).
* 1️⃣ Uses only **1** dependency ([`write-file-atomic`](https://github.com/npm/write-file-atomic))
* 🕊️ **Lightweight** package with an unpacked size of **12.1 kB**.
* 🖥️ Requires **Node.js v12.x** or greater

## Install 💾

**Node.js v12.x or greater is required for this package to work.**

```js
npm install jsoning
```

View the full documentation [here](https://jsoning.js.org/).

## Basic Usage 📑

```js
let jsoning = require('jsoning');
let database = new jsoning("database.json");


(async() => {

    // set some values with a key
    await db.set("birthday", "07-aug");
    await db.set("age", "13");

    // push stuff to an array for a particular key
    await db.push("transformers", "optimus prime");
    await db.push("transformers", "bumblebee");
    await db.push("transformers", "iron hide");

    // simply log what get is (i forgot what the transformers were)
    console.log(await db.get("transformers")); // [ 'optimus prime', 'bumblebee', 'iron hide' ]

    // just want to see what all is there
    console.log(await db.all()); // { object of the whole database contents }

    // does such a value exist
    console.log(await db.has("value2")); // false

    // my age keeps changing, so I'm deleting it
    console.log(await db.delete("age")); // true

    // i got 100$ for my birthday
    await db.set("money", 100);

    // and someone gave me 200 more dollars xD
    await db.math("money", "add", 200);

    // just wanna make sure how much money I got
    console.log(await db.get("money")); // 300

    // i'm getting bored, so i'm clearing the whole database
    await db.clear(); 

})();

```

## Links 🔗

* [Documentation](https://jsoning.js.org)
* [Guide](https://jsoning.netlify.app)
* [GitHub](https://github.com/khalby786/jsoning)
* [Discord](https://discord.gg/3v8P9RE)
* [Glitch](https://glitch.com/~jsoning)

## Contributing

Please see `CONTRIBUTING.md` for more details on contributing!

## License

This package is open sourced under the [MIT License](https://github.com/khalby786/jsoning/blob/master/LICENSE.md).

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_large)
