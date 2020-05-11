const fs = require('fs');
const { resolve } = require('path');

class Jsoning {

	/**
     * 
     * Create a new JSON database or initialise an exisiting database.
     * 
     * @param {string} database The name of the JSON database to be created or used. 
     * @returns {boolean} Whether an existing JSON file was used or created or the action failed.
     * 
     */
	constructor(database) {
		if (fs.existsSync(resolve(__dirname, database))) {
			this.database = database;
		} else {
			fs.writeFileSync(resolve(__dirname, database), '{}');
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
     * 
     * @returns {boolean} If element is set/updated successfully, returns true, else false.
     * 
     */
	set(key, value) {
		var db = require(resolve(__dirname, this.database));
		db[key] = value;
		fs.writeFileSync(resolve(__dirname, this.database), JSON.stringify(db));
		return true;
	}

	/**
     * 
     * Returns all the elements and their values of the JSON database.
     * 
     * @returns {Object} The object of all the key-value pairs of the database.
     * 
     */
	all() {
		let data = fs.readFileSync(resolve(__dirname, this.database), 'utf-8');
		data = JSON.parse(data);
		return data;
	}

	/**
     * 
     * Delete an element from the database based on its key.
     * 
     * @param {string} key The key of the element to be deleted.
     * @returns {Boolean} Returns true if the value exists, else returns false.
     * 
     */
	delete(key) {
		let db = JSON.parse(fs.readFileSync(resolve(__dirname, this.database), 'utf-8'));
		if (db[key]) {
			delete db[key];
			fs.writeFileSync(resolve(__dirname, this.database), JSON.stringify(db));
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
     * 
     */
	get(key) {
		let db = fs.readFileSync(resolve(__dirname, this.database), 'utf-8');
		db = JSON.parse(db);
		if (db[key]) {
			let data = db[key];
			return data;
		} else {
			return false;
		}
	}

}

module.exports = Jsoning;