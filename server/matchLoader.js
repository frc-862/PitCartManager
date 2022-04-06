var Datastore = require('nedb');

var db = {};
    
async function start(){
    db.matches = new Datastore({ filename: 'storage/matches.db', autoload: true });
    db.matches.loadDatabase();
}   
module.exports = start;
