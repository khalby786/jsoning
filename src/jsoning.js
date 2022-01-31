// fs module for read/write of JSON files
const fs = require("fs");
const { resolve } = require("path");

// write files atomically
var writeFileAtomic = require("write-file-atomic");

// if you look in each method, i'm reading the json database file
// and assigning it to a variable each time (mostly named db).
// while i could initialize this at the top of this file,
// that would mean changes made are not updated to the db variable at the top of the file,
// and hence, cause problems.

// i made this with very simple and basic functions, because the last thing i would want to feel
// when i (and others) read my own code is to be overwhelmed
// which surprisingly happens a lot

// i'm not what you'd call an experienced javascript developer, so feel free to point 
// out any mistakes or suggestions that you might have, i'd be more than happy
// to help you out.

// holy crap, i did it, i just managed to port my jsdoc to a ts .d.ts file

/**
 * 
 * Defines the types element values can be.
 * 
 * @typedef JSONValue
 * @type {(string|number|boolean|Object.<string, JSONValue>|JSONValue[]|null)}
 */
class Jsoning {
  /**
   *
   * Create a new JSON file for storing or initialize an exisiting file to be used.
   *
   * @param {string} database Path to the JSON file to be created or used.
   * @returns {boolean} Returns true if the JSON file was successfully initialised.
   *
   * @example <caption>Initialise a new JSON file or use an existing JSON file</caption>
   * const Jsoning = require('jsoning');
   *
   * let database = new Jsoning("database.json");
   * let database = new Jsoning("../path/to/database.json");
   */
  constructor(database) {
    // check for tricks
    if (!/\w+.json/.test(database)) {
      // database name MUST be of the pattern "words.json"
      throw new TypeError(
        "Invalid database file name. Make sure to provide a valid JSON database filename."
      );
    }

    // use an existing database or create a new one
    if (fs.existsSync(resolve(process.cwd(), database))) {
      this.database = database;
    } else {
      fs.writeFileSync(resolve(process.cwd(), database), "{}");
      this.database = database;
    }
    return true;
  }

  /**
   *
   * Adds an element to the database with the given value. If element with the given key exists, element value is updated.
   *
   * @param {string} key Key of the element to be set.
   * @param {JSONValue} value Value of the element to be set.
   * @returns {Promise<boolean>} If element is set/updated successfully, returns true; else false.
   *
   * @example
   * database.set("foo", "bar");
   * database.set("hi", 3);
   *
   * database.set("en", "db"); // { "en": "db" }
   * database.set("en", "en"); // { "en": "en" }
   *
   * let set = database.set("khaleel", "gibran");
   * console.log(set); // returns true
   *
   */
  async set(key, value) {
    // check for tricks
    if (typeof key !== "string" || key === "") {
      throw new TypeError("Invalid key/value for element");
    }

    let db = JSON.parse(
      fs.readFileSync(resolve(process.cwd(), this.database), "utf-8")
    );
    db[key] = value;
    try {
      await writeFileAtomic(
        resolve(process.cwd(), this.database),
        JSON.stringify(db)
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   *
   * Returns all the elements and their values of the JSON file.
   *
   * @returns {Object} All the key-value pairs of the database.
   * @example
   * database.set("foo", "bar");
   * database.set("hi", "hello");
   *
   * let all = database.all();
   * console.log(all); // { "foo": "bar", "hi": "hello" }
   *
   */
  all() {
    let data = fs.readFileSync(resolve(process.cwd(), this.database), "utf-8");
    data = JSON.parse(data);
    return data;
  }

  /**
   *
   * Deletes an element from the database based on its key.
   *
   * @param {string} key The key of the element to be deleted.
   * @returns {Promise<boolean>} Returns true if the value exists, else returns false.
   * @example
   * database.set("ping", "pong");
   * database.set("foo", "bar");
   *
   * database.delete("foo"); // returns true
   *
   */
  async delete(key) {
    // check for tricks
    if (typeof key !== "string" || key === "") {
      throw new TypeError("Invalid key of element");
    }

    let db = JSON.parse(
      fs.readFileSync(resolve(process.cwd(), this.database), "utf-8")
    );
    if (Object.prototype.hasOwnProperty.call(db, key)) {
      try {
        const removeProp = key;
        const { [removeProp]: remove, ...rest } = db;
        await writeFileAtomic(
          resolve(process.cwd(), this.database),
          JSON.stringify(rest)
        );
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   *
   * Returns the value of an element by key.
   *
   * @param {string} key The key of the element to be fetched.
   * @returns {JSONValue} Returns value, if element exists, else returns null.
   * @example
   * database.set("food", "pizza");
   *
   * let food = database.get("food");
   * console.log(food) // returns pizza
   *
   */
  get(key) {
    // look for tricks
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    }

    let db = fs.readFileSync(resolve(process.cwd(), this.database), "utf-8");
    db = JSON.parse(db);
    if (Object.prototype.hasOwnProperty.call(db, key)) {
      let data = db[key];
      return data;
    } else {
      return null;
    }
  }

  /**
   *
   * Deletes the contents of the JSON file.
   *
   * @returns {Promise<boolean>}
   * @example
   * database.set("foo", "bar");
   * database.set("en", "db");
   *
   * database.clear(); // return {}
   *
   */
  async clear() {
    let cleared = {};
    try {
      await writeFileAtomic(
        resolve(process.cwd(), this.database),
        JSON.stringify(cleared)
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   *
   * Performs basic mathematical operations on values of elements.
   *
   * @param {string} key The key of the element on which the mathematical operation is to be performed.
   * @param {string} operation The operation to perform, one of add, subtract, multiply and divide.
   * @param {number} operand The number for performing the mathematical operation (the operand).
   *
   * @returns {Promise<boolean>} True if the operation succeeded, else false.
   *
   * @example
   * database.set("value1", 1);
   * database.set("value2", 10);
   *
   * database.math("value1", "add", 1);
   * database.math("value2", "multiply", 5);
   *
   * console.log(database.get("value1")); // returns 1+1 = 2
   * console.log(database.get("value2")); // returns 10*5 = 50
   *
   */
  async math(key, operation, operand) {
    // key types
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    }

    // operation tricks
    if (typeof operation !== "string" || operation == "") {
      throw new TypeError("Invalid Jsoning#math operation.");
    }

    // operand tricks
    if (typeof operand !== "number") {
      throw new TypeError("Operand must be a number type!");
    }

    // see if value exists
    let db = JSON.parse(
      fs.readFileSync(resolve(process.cwd(), this.database), "utf-8")
    );
    if (Object.prototype.hasOwnProperty.call(db, key)) {
      // key exists
      let value = db[key];
      if (typeof value !== "number") {
        throw new Error(
          "Key of existing element must be a number for Jsoning#math to happen."
        );
      }
      var result;
      switch (operation) {
        case "add":
        case "addition":
          result = value + operand;
          break;
        case "subtract":
        case "subtraction":
          result = value - operand;
          break;
        case "multiply":
        case "multiplication":
          result = value * operand;
          break;
        case "divide":
        case "division":
          result = value / operand;
          break;
        default:
          throw new Error("Operation not found!");
      }
      db[key] = result;
      try {
        await writeFileAtomic(
          resolve(process.cwd(), this.database),
          JSON.stringify(db)
        );
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    } else {
      // key doesn't exist
      return false;
    }
  }

  /**
   *
   * Check if a particular element exists by key.
   *
   * @param {string} key The key of the element to see if the element exists.
   *
   * @returns {boolean} True if the element exists, false if the element doesn't exist.
   *
   * @example
   * database.set("some value", "hi");
   *
   * let has = database.has("some value");
   * console.log(has); // returns true
   *
   * let has2 = database.has("value");
   * console.log(has2); // returns false
   */
  has(key) {
    // too many tricks
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    }

    let db = fs.readFileSync(resolve(process.cwd(), this.database), "utf-8");
    db = JSON.parse(db);

    if (Object.prototype.hasOwnProperty.call(db, key)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * Adds the given value into the provided element (if it's an array) in the database based on the key. If no such element exists, it will initialize a new element with an empty array.
   *
   * @param {string} key The key of the element.
   * @param {JSONValue} value The value to be added to the element array.
   *
   * @returns {Promise<boolean>} True if the the value was pushed to an array successfully, else false.
   *
   * @example
   * database.push("leaderboard", "khaleel");
   * database.push("leaderboard", "RiversideRocks");
   *
   */
  async push(key, value) {
    // see if element exists
    let db = fs.readFileSync(resolve(process.cwd(), this.database), "utf-8");
    db = JSON.parse(db);

    if (Object.prototype.hasOwnProperty.call(db, key)) {
      if (Array.isArray(db[key]) === false) {
        // it's not an array!
        if (db[key] !== undefined || db[key] !== null) {
          // its not undefined or null
          throw new TypeError(
            "Existing element must be of type Array for Jsoning#push to work."
          );
        } else if (db[key] === undefined || db[key] === null) {
          // it may not be an array, but its either undefined or null
          // so we initialize a new array
          db[key] = [];
          db[key].push(value);
          try {
            await writeFileAtomic(
              resolve(process.cwd(), this.database),
              JSON.stringify(db)
            );
            return true;
          } catch (err) {
            console.error(err);
            return false;
          }
        }
      } else if (Array.isArray(db[key])) {
        // but what if...? it was an array
        db[key].push(value);
        try {
          await writeFileAtomic(
            resolve(process.cwd(), this.database),
            JSON.stringify(db)
          );
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      } else {
        return false;
      }
    } else {
      // key doesn't exist, so let's make one and do the pushing
      db[key] = [];
      db[key].push(value);
      try {
        await writeFileAtomic(
          resolve(process.cwd(), this.database),
          JSON.stringify(db)
        );
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  /**
   *
   * Removes a given primitive value from an array in the database based on the key. If no existing array, it will do nothing.
   *
   * @param {string} key The key of the element.
   * @param {JSONValue} value The value to be removed from the element array.
   *
   * @returns {Promise<boolean>} True if successfully removed or not found or the key does not exist, else false.
   *
   * @example
   * database.remove("leaderboard", "wh0");
   *
   */
  async remove(key, value) {
    // see if element exists
    let db = fs.readFileSync(resolve(process.cwd(), this.database), "utf-8");
    db = JSON.parse(db);

    if (!Object.prototype.hasOwnProperty.call(db, key)) {
      return true;
    }
    if (!Array.isArray(db[key])) {
      console.error(
        "Existing element must be of type Array for Jsoning#remove to work."
      );
      return false;
    }
    db[key] = db[key].filter((item) => item !== value);
    try {
      await writeFileAtomic(
        resolve(process.cwd(), this.database),
        JSON.stringify(db)
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = Jsoning;
