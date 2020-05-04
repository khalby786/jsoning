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
    
    push (key, value) {
        if (typeof db[key] !== Array) { throw new Error("type of key is not Array") }
        if (typeof value !== Array){
            db[key].push(value)
            fs.writeFile("database.json", JSON.stringify(db), function(err) {
                if (err) throw err;
                console.log("Written!");
            });
            return true;
        }
        value.forEach(val => db[key].push(val))
        fs.writeFile("database.json", JSON.stringify(db), function(err) {
            if (err) throw err;
            console.log("Written!");
        });
        return true;
    }
}

module.exports = Jsoning;
