const fs = require('fs');

class Jsoning {

    constructor(database) {
        if (fs.existsSync(database)) {
            this.database = database;
        } else {
            fs.writeFileSync(database, '{}');
            this.database = database;
        }
    }

    set(key, value) {
        var db = require(this.database);
        console.log(db);
        db[key] = value;
        fs.writeFile("database.json", JSON.stringify(db), function(err) {
            if (err) throw err;
            console.log("Written!");
        });
        console.log("Value successfully set");
        return true;
    }

    all() {
        let data = fs.readFileSync(this.database);
        data = JSON.parse(data);
        return data;
    }
}

module.exports = Jsoning;