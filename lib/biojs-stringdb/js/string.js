var request = require('request');
var Promise = require('promise');

var StringDB = function(db, access, format, request){
    //standard settings aim towards retrieving network info 
    //for an identifier as tsv
    this.db = db || "string-db.org";
    this.access = access || "api";
    this.format = format || "psi-mi-tab";
    this.request = request || "interactions";

};

StringDB.prototype.getNetwork = function(gene, proxy){
    //get the network info as specified by the instance variables
    var url = 'http://' +  proxy + this.db + '/' + 
            this.access + '/' +
            this.format + '/' +
            this.request + '?' + 
            'identifier=' + gene;

    //returns a promise, not a callback
    return new Promise(function(resolve){
        try {
            request(url, function(err, res, body){
                resolve(body);
            });
        } catch(err){
            throw new Error("No STRINGdb entry for given identifier");
        }
    });
};

StringDB.prototype.networkToJSON = function(tsv){
    //converts the tsv string to a JSON object
    var lines = tsv.split("\n");
    var parts;
    var edges = [];
    var contains = [];
    var nodes = [];
    for(var i=0; i<lines.length; i++){
        line = lines[i].split("\t");
        if(line.length > 1){
            edges.push({ source: line[2], target: line[3] });
            
            if(contains.indexOf(line[2]) === -1){
                nodes.push({ id: line[2], name: line[2] });
                contains.push(line[2]);
            }
            if(contains.indexOf(line[3]) === -1){
                nodes.push({ id: line[3], name: line[3] });
                contains.push(line[3]);
            }
        }
        else {
            continue;
        }
    }
    return { nodes: nodes, edges: edges };
};


module.exports = StringDB;
