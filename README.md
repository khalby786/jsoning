<div align="center">

<img src="https://raw.githubusercontent.com/khalby786/jsoning/master/media/jsoning.svg" alt="jsoning" width="250px">

✨ A simple key-value JSON-based lightweight database. ✨

<br />

![CodeCov](https://codecov.io/gh/khalby786/jsoning/branch/master/graph/badge.svg)
[![Build Status](https://travis-ci.org/khalby786/jsoning.svg?branch=master)](https://travis-ci.org/khalby786/jsoning)
[![Latest Stable Version](https://img.shields.io/npm/v/jsoning.svg)](https://www.npmjs.com/package/jsoning)
[![NPM Downloads](https://img.shields.io/npm/dm/jsoning.svg)](https://www.npmjs.com/package/jsoning)
![node-current](https://img.shields.io/node/v/jsoning)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_shield)

<br />

[View Demo](https://glitch.com/edit/#!/jsoning) · [Report Bug](https://github.com/khalby786/jsoning/issues) · [Request Feature](https://github.com/khalby786/jsoning/issues)

</div>

---

Jsoning is a simplified wrapper for Node.js that lets you write and read data to and from JSON files. It's designed to be beginner-friendly and easy to use, with a simple API that makes it easy to get started with. It's perfect for small projects, prototyping, and learning how to work with databases.


## Features

- Use existing JSON files to read and write key-value pairs
- EventEmitters to listen to changes in the database
- Atomic file writing to prevent data corruption
- Easier to use than a toaster
- TypeScript support for all the fixed-type addicts out there

## Install

**Node.js v16.x or greater is required for this package to work.**

```bash
npm i jsoning

# pnpm if you're feeling fast
pnpm i jsoning

# yarn if you're feeling fancy
yarn add jsoning
```

View the full documentation [here](https://jsoning.js.org/).

## Basic Usage 

```ts
import { Jsoning, MathOps } from 'jsoning';
const db = new Jsoning('database.json');

// Set some values with a key
await db.set('birthday', '07-aug');
await db.set('age', '13');

// Push stuff to an array for a particular key
await db.push('transformers', 'optimus prime');
await db.push('transformers', 'bumblebee');
await db.push('transformers', 'iron hide');

// Get the value of a key
console.log(await db.get('transformers')); // [ 'optimus prime', 'bumblebee', 'iron hide' ]

// Get all the values
console.log(await db.all()); // { Record<string, JSONValue> of the whole database contents }

// does such a value exist?
console.log(await db.has('value2')); // false

// My age keeps changing, so I'm deleting it
console.log(await db.delete('age')); // true

// I got $100 for my birthday
await db.set('money', 100);

// and someone gave me $200 more
await db.math('money', MathOps.Add, 200);

// Just wanna make sure how much money I got
console.log(await db.get<number>('money')); // 300

// RIP iron hide, he died
await db.remove('transformers', 'iron hide');

// I'm getting bored, so I'm clearing the whole database
await db.clear();
```

## Contributing

Please see `CONTRIBUTING.md` for more details on contributing!

### Contributors

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-9-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/khalby786"><img src="https://avatars.githubusercontent.com/u/38468163?v=4?s=100" width="100px;" alt="Khaleel Gibran"/><br /><sub><b>Khaleel Gibran</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Documentation">📖</a> <a href="#design-khalby786" title="Design">🎨</a> <a href="#infra-khalby786" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/khalby786/jsoning/commits?author=khalby786" title="Tests">⚠️</a> <a href="#tutorial-khalby786" title="Tutorials">✅</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://aboutdavid.me/"><img src="https://avatars.githubusercontent.com/u/62346025?v=4?s=100" width="100px;" alt="David"/><br /><sub><b>David</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=aboutDavid" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jonyk56"><img src="https://avatars.githubusercontent.com/u/44901605?v=4?s=100" width="100px;" alt="Jonyk56"/><br /><sub><b>Jonyk56</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=Jonyk56" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ayntee"><img src="https://avatars.githubusercontent.com/u/34645569?v=4?s=100" width="100px;" alt="ayntee"/><br /><sub><b>ayntee</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=ayntee" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://xetha-bot.me/"><img src="https://avatars.githubusercontent.com/u/46276781?v=4?s=100" width="100px;" alt="undefine"/><br /><sub><b>undefine</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=oadpoaw" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/issues?q=author%3Aoadpoaw" title="Bug reports">🐛</a> <a href="#security-oadpoaw" title="Security">🛡️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/adi-g15"><img src="https://avatars.githubusercontent.com/u/37269665?v=4?s=100" width="100px;" alt="Aditya Gupta"/><br /><sub><b>Aditya Gupta</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=adi-g15" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.creativepragmatics.com"><img src="https://avatars.githubusercontent.com/u/142797?v=4?s=100" width="100px;" alt="Manuel Maly"/><br /><sub><b>Manuel Maly</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=manmal" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/issues?q=author%3Amanmal" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://wh0.github.io/"><img src="https://avatars.githubusercontent.com/u/382796?v=4?s=100" width="100px;" alt="wh0"/><br /><sub><b>wh0</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=wh0" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://akpi.is-a.dev/"><img src="https://avatars.githubusercontent.com/u/111009970?v=4?s=100" width="100px;" alt="akpi816218"/><br /><sub><b>akpi816218</b></sub></a><br /><a href="https://github.com/khalby786/jsoning/commits?author=akpi816218" title="Code">💻</a> <a href="https://github.com/khalby786/jsoning/commits?author=akpi816218" title="Documentation">📖</a> <a href="#example-akpi816218" title="Examples">💡</a> <a href="#maintenance-akpi816218" title="Maintenance">🚧</a> <a href="https://github.com/khalby786/jsoning/commits?author=akpi816218" title="Tests">⚠️</a> <a href="#tool-akpi816218" title="Tools">🔧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://allcontributors.org) specification.
Contributions of any kind are welcome!

## License

This package is open sourced under the [MIT License](https://github.com/khalby786/jsoning/blob/master/LICENSE.md).

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning.svg?type=small)](https://app.fossa.com/projects/git%2Bgithub.com%2Fkhalby786%2Fjsoning?ref=badge_large)
