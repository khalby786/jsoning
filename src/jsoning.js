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

  all() {
    let data = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    data = JSON.parse(data);
    return data;
  }

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

  clear() {
    let cleared = {};
    writeFileAtomicSync(resolve(__dirname, this.database), JSON.stringify(cleared), { chown: false });
    return true;
  }

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

  has(key) {

    // too many tricks
    if (typeof key !== "string" || key == "") {
      throw new TypeError("Invalid key of element");
    };

    let db = fs.readFileSync(resolve(__dirname, this.database), "utf-8");
    db = JSON.parse(db);

    if(db[key]) {
        return true;
    } else {
        return false;
    }

  }
}

module.exports = Jsoning;