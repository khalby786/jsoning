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

    set(key, value) {
        var db = require(resolve(__dirname, this.database));
        db[key] = value;
        fs.writeFileSync(resolve(__dirname, this.database), JSON.stringify(db));
        return true;
    }

    all() {
        let data = fs.readFileSync(resolve(__dirname, this.database), 'utf-8');
        data = JSON.parse(data);
        return data;
    }

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