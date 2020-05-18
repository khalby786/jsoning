const fs = require("fs");
const { resolve } = require("path");

// write files atomically
var writeFileAtomicSync = require('write-file-atomic').sync;

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
    if (typeof key !== "string" || key == "" || value == "") {
      throw new TypeError("Invalid key/value for element");
    }

    var db = require(resolve(__dirname, this.database));
    db[key] = value;
    writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(db));
    // writeFileAtomic('db.json', JSON.stringify(db), { chown: false }, function(err) {
    //   if (err) throw err;
    //   break;
    // });
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
      writeFileAtomicSync(resolve(__dirname + this.database), JSON.stringify(db));
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
   * console.log("food") // returns pizza
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
    writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(cleared), {});
    return true;
  }
}

module.exports = Jsoning;
