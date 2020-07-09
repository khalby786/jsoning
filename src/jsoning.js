// fs module for read/write of JSON files
const fs = require("fs");
const { resolve } = require("path");

// write files atomically
var writeFileAtomicSync = require('write-file-atomic').sync;

// if you look in each method, i'm reading the json database file 
// and assigning it to a variable (mostly named db). 
// while i could initialize this at the top of this file, 
// that would mean changes made are not updated to the db variable at the top of the file, 
// and hence, cause problems.

class Jsoning {
 /**
   *
   * Create a new JSON database or initialize an exisiting database.
   *
   * @param {string} database The name of the JSON database to be created or used.
   * @returns {boolean} Whether an existing JSON file was used or created or the action failed.
   * @example
   * const jsoning = require('jsoning');
   * var database = new jsoning("database.json");
   *
   */
  constructor(database) {

    // check for tricks
    if (typeof database !== "string" || database === "" || database === undefined || database.substr(database.length - 5) !== ".json") {
      throw new TypeError("Unknown database file name. Make sure to provide a valid JSON database filename.");
    }

    // use an existing database or create a new one
    if (fs.existsSync(resolve(__dirname, database))) {
      this.database = database;
    } else {
      fs.writeFileSync(resolve(__dirname, database), "{}");
      this.database = database;
    }
    return true;
  }

  /**
   *
   * Adds an element to a database with the specified value. If element exists, element value is updated.
   *
   * @param {string} key Key of the element to be set.
   * @param {*} value Value of the element to be set.
   * @returns {boolean} If element is set/updated successfully, returns true, else false.
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
  set(key, value) {

    // check for tricks
    if (typeof key !== "string" || key === "") {
      throw new TypeError("Invalid key/value for element");
    }

    var db = require(resolve(__dirname, this.database));
    db[key] = value;
    writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db), { chown: false });
    return true;
  }

  /**
   *
   * Returns all the elements and their values of the JSON database.
   *
   * @returns {Object} The object of all the key-value pairs of the database.
   * @example
   * database.set("foo", "bar");
   * database.set("hi", "hello");
   *
   * let all = database.all();
   * console.log(all); // { "foo": "bar", "hi": "hello" }
   *
   */
  all() {
    let data = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    data = JSON.parse(data);
    return data;
  }

  /**
   *
   * Delete an element from the database based on its key.
   *
   * @param {string} key The key of the element to be deleted.
   * @returns {Boolean} Returns true if the value exists, else returns false.
   * @example
   * database.set("ping", "pong");
   * database.set("foo", "bar");
   *
   * database.delete("foo"); // returns true
   *
   */
  delete(key) {

    // check for tricks
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    }

    let db = JSON.parse(
      fs.readFileSync(resolve(__dirname, this.database), "utf-8")
    );
    if (db[key]) {
      delete db[key];
      writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db), { chown: false });
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * Gets the value of an element based on it's key.
   *
   * @param {string} key The key of the element to be fetched.
   * @returns {*} Returns value, if element exists, else returns false.
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

    let db = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    db = JSON.parse(db);
    if (db[key]) {
      let data = db[key];
      return data;
    } else {
      return false;
    }
  }

  /**
   *
   * Clear the whole JSON database.
   *
   * @returns {Boolean}
   * @example
   * database.set("foo", "bar");
   * database.set("en", "db");
   *
   * database.clear(); // return {}
   *
   */
  clear() {
    let cleared = {};
    writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(cleared), { chown: false });
    return true;
  }

  /**
   * 
   * Performs mathematical operations on values of elements.
   * 
   * @param {string} key The key of the element on which the mathematical operation is to be performed.
   * @param {string} operation The operation to perform, one of add, subtract, multiply and divide.
   * @param {number} operand The number for performing the mathematical operation (the operand).
   * 
   * @returns {Boolean} True if the operation succeeded, else false.
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
  math(key, operation, operand) {

    // key types
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    };

    // operation tricks
    if (typeof operation !== "string" || operation == "") {
      throw new TypeError("Invalid Jsoning#math operation.");
    };

    // operand tricks
    if (typeof operand !== "number" || operand === null || operand === undefined) {
      throw new TypeError("Operand must be a number type!");
    };

    // see if value exists
    let db = JSON.parse(fs.readFileSync(resolve(__dirname, this.database), "utf-8"));
    if (db[key]) {
      // key exists
      let value = db[key];
      if (typeof value !== "number" || value === "") {
        throw new Error("Key of existing element must be a number for Jsoning#math to happen.")
      } 
      var result;
      switch (operation) {
        case 'add':
        case 'addition':
          result = value + operand;
          break;
        case 'subtract':
        case 'subtraction':
          result = value - operand;
          break;
        case 'multiply':
        case 'multiplication':
          result = value * operand;
          break;
        case 'divide':
        case 'division':
          result = value / operand;
          break;
        default:
          throw new Error("Operation not found!");
      }
      db[key] = result;
      writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db), { chown: false, tmpfileCreated: function() {
        console.log("Temporary file created!")
      }});
      return true;
    } else {
      // key doesn't exist
      return false;
    }
  }

  /**
   * 
   * See if a particular element exists by using it's key.
   * 
   * @param {string} key The key of the element to see if the element exists.
   * 
   * @returns {Boolean} True if the element exists or false if the element doesn't exist.
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
    };

    let db = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    db = JSON.parse(db);

    if(db.hasOwnProperty(key)) {
        return true;
    } else {
        return false;
    }

  }

  /**
   * 
   * This function will push given value into an array in the database based on the key, which can be accessed with dot notation. If no existing array, it will create one.
   * 
   * @param {string} key 
   * @param {string} value 
   * 
   * @returns {Boolean} True if the the value was pushed to an array successfully, else false.
   * 
   * @example
   * database.push("leaderboard", "khaleel");
   * database.push("leaderboard", "RiversideRocks");
   * 
   */
  push(key, value) {

    // see if element exists
    let db = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    db = JSON.parse(db);

    if (db.hasOwnProperty(key)) {
        console.log("exists");
        if (!Array.isArray(db[key])) {
            throw new TypeError("Existing element must be of type Array for Jsoning#push to work.")
        } else if (Array.isArray(db[key])) {
            db[key].push(value);
            writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db), { chown: false });
            return true;
        } else {
            return false;
        }
    } else {
        console.log("doesn't exist")
        db[key] = [];
        db[key].push(value);
        writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db), { chown: false });
        return true;
    }

  }
}

module.exports = Jsoning;