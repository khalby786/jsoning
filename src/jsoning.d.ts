export = Jsoning;
declare class Jsoning {
    /**
     *
     * Create a new JSON file for storing or initialize an exisiting file to be used.
     *
     * @param {string} database The name of the JSON file to be created or used.
     * @returns {boolean} Returns true.
     * @example
     * const jsoning = require('jsoning');
     * var database = new jsoning("database.json");
     *
     */
    constructor(database: string);
    database: string;
    /**
     *
     * Adds an element to the database with the specified value. If element with the given key exists, element value is updated.
     *
     * @param {string} key Key of the element to be set.
     * @param {*} value Value of the element to be set.
     * @returns {boolean} If element is set/updated successfully, returns true; else false.
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
    set(key: string, value: any): boolean;
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
    all(): any;
    /**
     *
     * Deletes an element from the database based on its key.
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
    delete(key: string): boolean;
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
    get(key: string): any;
    /**
     *
     * Clears the whole JSON database.
     *
     * @returns {Boolean}
     * @example
     * database.set("foo", "bar");
     * database.set("en", "db");
     *
     * database.clear(); // return {}
     *
     */
    clear(): boolean;
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
    math(key: string, operation: string, operand: number): boolean;
    /**
     *
     * Check if a particular element exists by key.
     *
     * @param {string} key The key of the element to see if the element exists.
     *
     * @returns {Boolean} True if the element exists, false if the element doesn't exist.
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
    has(key: string): boolean;
    /**
     *
     * This function will push the given value into the provided element (if it's an array) in the database based on the key. If no such element exists, it will initialize a new element with an empty array.
     *
     * @param {string} key
     * @param {(string|number|boolean|null|undefined|Object)} value
     *
     * @returns {Boolean} True if the the value was pushed to an array successfully, else false.
     *
     * @example
     * database.push("leaderboard", "khaleel");
     * database.push("leaderboard", "RiversideRocks");
     *
     */
    push(key: string, value: (string | number | boolean | null | undefined | any)): boolean;
}
