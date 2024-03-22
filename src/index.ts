import { resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import writeFileAtomic from 'write-file-atomic';
import { readFile } from 'fs/promises';

/**
 * Defines the types element values can be.
 * @typedef JSONValue
 * @type {(string|number|boolean|Record<string, JSONValue>|JSONValue[]|undefined|null)}
 */
// @ts-expect-error Ignore circular reference
export type JSONValue =
	| string
	| number
	| boolean
	| Record<string, JSONValue>
	| JSONValue[]
	| undefined
	| null;

/**
 * @enum {string} MathOps
 * @readonly
 */
export enum MathOps {
	Add = 'add',
	Subtract = 'subtract',
	Multiply = 'multiply',
	Divide = 'divide'
}

export class Jsoning {
	database: string;
	/**
	 * Create a new JSON file for storing or initialize an exisiting file to be used.
	 * @param {string} database Path to the JSON file to be created or used.
	 */
	constructor(database: string) {
		// check for tricks
		if (!/\w+.json/.test(database)) {
			// database name MUST be of the pattern "words.json"
			throw new TypeError(
				'Invalid database file name. Make sure to provide a valid JSON database filename.'
			);
		}

		// use an existing database or create a new one
		if (!existsSync(resolve(process.cwd(), database)))
			writeFileSync(resolve(process.cwd(), database), '{}');

		/**
		 * @property {string} database Path to the JSON file to be used.
		 */
		this.database = database;
	}

	/**
	 * Adds an element to the database with the given value. If element with the given key exists, element value is updated.
	 * @param {string} key Key of the element to be set.
	 * @param {JSONValue} value Value of the element to be set.
	 * @returns {Promise<boolean>} If element is set/updated successfully, returns true; else false.
	 */
	async set(key: string, value: JSONValue): Promise<boolean> {
		// check for tricks
		if (typeof key !== 'string' || key === '') {
			throw new TypeError('Invalid key');
		}

		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);
		db[key] = value;
		try {
			await writeFileAtomic(
				resolve(process.cwd(), this.database),
				JSON.stringify(db)
			);
			return true;
		} catch (err) {
			throw new Error(`Failed to set element: ${err}`);
		}
	}

	/**
	 * Returns all the elements and their values of the JSON file.
	 * @returns {Promise<Record<string, JSONValue>>} All the key-value pairs of the database.
	 */
	async all(): Promise<Record<string, JSONValue>> {
		return JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);
	}

	/**
	 * Deletes an element from the database based on its key.
	 * @param {string} key The key of the element to be deleted.
	 * @returns {Promise<boolean>} Returns true if the value exists, else returns false.
	 */
	async delete(key: string): Promise<boolean> {
		// check for tricks
		if (typeof key !== 'string' || key === '') {
			throw new TypeError('Invalid key of element');
		}

		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);
		if (key in db) {
			try {
				const removeProp = key;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { [removeProp]: remove, ...rest } = db;
				await writeFileAtomic(
					resolve(process.cwd(), this.database),
					JSON.stringify(rest)
				);
				return true;
			} catch (err) {
				throw new Error(`Failed to delete element: ${err}`);
			}
		} else {
			return false;
		}
	}

	/**
	 * Returns the value of an element by key.
	 * @param {string} key The key of the element to be fetched.
	 * @returns {Promise<(T extends JSONValue ? T : JSONValue) | null>} Returns value if element exists, else returns null.
	 */
	async get<T extends JSONValue>(
		key: string
	): Promise<(T extends JSONValue ? T : JSONValue) | null> {
		// look for tricks
		if (typeof key !== 'string' || key == '') {
			throw new TypeError('Invalid key of element');
		}

		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);
		if (key in db) {
			return db[key];
		} else {
			return null;
		}
	}

	/**
	 * Deletes the contents of the JSON file.
	 * @returns {Promise<boolean>} Returns true if the file is cleared, else false.
	 */
	async clear(): Promise<boolean> {
		try {
			await writeFileAtomic(
				resolve(process.cwd(), this.database),
				JSON.stringify({})
			);
			return true;
		} catch (err) {
			throw new Error(`Failed to clear database: ${err}`);
		}
	}

	/**
	 * Performs basic mathematical operations on values of elements.
	 * @param {string} key The key of the element on which the mathematical operation is to be performed.
	 * @param {MathOps} operation The operation to perform, one of add, subtract, multiply and divide.
	 * @param {number} operand The number for performing the mathematical operation (the operand).
	 * @returns {Promise<boolean>} True if the operation succeeded, else false.
	 */
	async math(
		key: string,
		operation: MathOps,
		operand: number
	): Promise<boolean> {
		// key types
		if (typeof key !== 'string' || key == '') {
			throw new TypeError('Invalid key of element');
		}

		// operation tricks
		if (typeof operation !== 'string') {
			throw new TypeError('Invalid Jsoning#math operation.');
		}

		// operand tricks
		if (typeof operand !== 'number') {
			throw new TypeError('Operand must be a number type!');
		}

		// see if value exists
		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);
		if (key in db) {
			// key exists
			const value = db[key];
			if (typeof value !== 'number') {
				throw new TypeError(
					'Key of existing element must be a number for Jsoning#math to happen.'
				);
			}
			let result: number;
			switch (operation) {
				case MathOps.Add:
					result = value + operand;
					break;
				case MathOps.Subtract:
					result = value - operand;
					break;
				case MathOps.Multiply:
					result = value * operand;
					break;
				case MathOps.Divide:
					result = value / operand;
					break;
				default:
					throw new Error('Operation not found!');
			}
			db[key] = result;
			try {
				await writeFileAtomic(
					resolve(process.cwd(), this.database),
					JSON.stringify(db)
				);
				return true;
			} catch (err) {
				throw new Error(`Failed to perform math operation: ${err}`);
			}
		} else {
			// key doesn't exist
			return false;
		}
	}

	/**
	 * Check if a particular element exists by key.
	 * @param {string} key The key of the element to see if the element exists.
	 * @returns {Promise<boolean>} True if the element exists, false if the element doesn't exist.
	 */
	async has(key: string): Promise<boolean> {
		// too many tricks
		if (typeof key !== 'string' || key == '') {
			throw new TypeError('Invalid key of element');
		}

		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);

		if (key in db) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Adds the given value into the provided element (if it's an array) in the database based on the key. If no such element exists, it will initialize a new element with an empty array.
	 * @param {string} key The key of the element.
	 * @param {JSONValue} value The value to be added to the element array.
	 * @returns {Promise<boolean>} True if the the value was pushed to an array successfully, else false.
	 */
	async push(key: string, value: JSONValue): Promise<boolean> {
		// see if element exists
		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);

		if (key in db) {
			if (Array.isArray(db[key]) === false) {
				// it's not an array!
				if (db[key] !== undefined || db[key] !== null) {
					// its not undefined or null
					throw new TypeError(
						'Existing element must be of type Array for Jsoning#push to work.'
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
				throw new Error(`Failed to push element: ${err}`);
			}
		}
	}

	/**
	 * Removes a given primitive value from an array in the database based on the key. If the value does not exist or is not an array, it will do nothing.
	 * @param {string} key The key of the element.
	 * @param {JSONValue} value The value to be removed from the element array.
	 * @returns {Promise<boolean>} True if successfully removed or not found or the key does not exist, else false.
	 */
	async remove(key: string, value: JSONValue): Promise<boolean> {
		// see if element exists
		const db = JSON.parse(
			await readFile(resolve(process.cwd(), this.database), 'utf-8')
		);

		if (!(key in db)) {
			return true;
		}
		if (!Array.isArray(db[key])) {
			throw new Error(
				'Existing element must be of type Array for Jsoning#remove to work.'
			);
		}
		db[key] = db[key].filter((item: unknown) => item !== value);
		try {
			await writeFileAtomic(
				resolve(process.cwd(), this.database),
				JSON.stringify(db)
			);
			return true;
		} catch (err) {
			throw new Error(`Failed to remove element: ${err}`);
		}
	}
}

export default Jsoning;
