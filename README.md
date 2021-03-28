![jsoning](https://raw.githubusercontent.com/khalby786/jsoning/master/media/jsoning.svg)

<div align="center">

# jsoning

✨ A simple key-value JSON-based persistent lightweight database. ✨

<br />

![CodeCov](https://codecov.io/gh/khalby786/jsoning/branch/master/graph/badge.svg)
[![Build Status](https://travis-ci.org/khalby786/jsoning.svg?branch=master)](https://travis-ci.org/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/forks/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Build Status](https://img.shields.io/github/stars/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![License](https://img.shields.io/github/license/khalby786/jsoning.svg)](https://github.com/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![NPM Downloads](https://img.shields.io/npm/dt/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)
![Pkgreview.dev Reviews](https://img.shields.io/pkgreview/rating/npm/jsoning)
![npm bundle size](https://img.shields.io/bundlephobia/min/jsoning)
![GitHub repo size](https://img.shields.io/github/repo-size/khalby786/jsoning)
![node-current](https://img.shields.io/node/v/jsoning)
![Website](https://img.shields.io/website?down_color=red&down_message=offline&up_color=green&up_message=online&url=https%3A%2F%2Fkhalby786.github.io%2Fjsoning)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_shield)

<br />

[View Demo](https://glitch.com/edit/#!/jsoning) · [Report Bug](https://github.com/khalby786/jsoning/issues) · [Request Feature](https://github.com/khalby786/jsoning/issues)

Loved the project? Please consider [donating](https://buymeacoffee.com/khaleelgibran) to help it improve!

</div>


| **Like us a lot?** Help others know why you like us! **Review this package on [pkgreview.dev](https://pkgreview.dev/npm/jsoning)** | ➡   | [![Review us on pkgreview.dev](https://i.ibb.co/McjVMfb/pkgreview-dev.jpg)](https://pkgreview.dev/npm/jsoning) |             
| ----------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------- |

## Features

* Uses JSON files to modify and write key-value elements as JSON-objects.
* Easy to use and lightweight.
* Prevents JSON corruption with [atomic file writing](https://github.com/npm/write-file-atomic).
* Uses a single dependency ([`write-file-atomic`](https://github.com/npm/write-file-atomic))

## Install 💾

**Node.js v12.x or greater is required for this package to work.**

```bash
npm install jsoning
```

View the full documentation [here](https://jsoning.js.org/).

## Basic Usage 📑

```js
let jsoning = require("jsoning");
let db = new jsoning("database.json");


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
* [Glitch](https://glitch.com/~jsoning)

## Contributing

Please see `CONTRIBUTING.md` for more details on contributing!

### Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/khalby786"><img src="https://avatars.githubusercontent.com/u/38468163?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Khaleel Gibran</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Documentation">📖</a> <a href="#design-khalby786" title="Design">🎨</a> <a href="#infra-khalby786" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Tests">⚠️</a> <a href="#tutorial-khalby786" title="Tutorials">✅</a></td>
    <td align="center"><a href="https://aboutdavid.me/"><img src="https://avatars.githubusercontent.com/u/62346025?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=aboutDavid" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Jonyk56"><img src="https://avatars.githubusercontent.com/u/44901605?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jonyk56</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=Jonyk56" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ayntee"><img src="https://avatars.githubusercontent.com/u/34645569?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ayntee</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=ayntee" title="Code">💻</a></td>
    <td align="center"><a href="https://xetha-bot.me/"><img src="https://avatars.githubusercontent.com/u/46276781?v=4?s=100" width="100px;" alt=""/><br /><sub><b>undefine</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=oadpoaw" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/issues?q=author%3Aoadpoaw" title="Bug reports">🐛</a> <a href="#security-oadpoaw" title="Security">🛡️</a></td>
    <td align="center"><a href="https://github.com/adi-g15"><img src="https://avatars.githubusercontent.com/u/37269665?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aditya Gupta</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=adi-g15" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://allcontributors.org) specification.
Contributions of any kind are welcome!

## License

This package is open sourced under the [MIT License](https://github.com/khalby786/jsoning/blob/master/LICENSE.md).

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_large)
