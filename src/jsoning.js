const fs = require('fs');
const { resolve } = require('path');

class Jsoning {

    constructor(database) {
        if (fs.existsSync(resolve(__dirname, database))) {
            this.database = database;
        } else {
            fs.writeFileSync(resolve(__dirname, database), '{}');
            this.database = database;
        }
    }

    set(key, value) {
        var db = require(resolve(__dirname, this.database));
        console.log(db);
        db[key] = value;
        fs.writeFileSync(resolve(__dirname, this.database), JSON.stringify(db));
        console.log("Value successfully set");
        return true;
    }

    all() {
        let data = fs.readFileSync(resolve(__dirname, this.database));
        data = JSON.parse(data);
        return data;
    }
}

module.exports = Jsoning;