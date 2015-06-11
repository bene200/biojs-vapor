var Vapor = module.exports = function(obj){
    this.mode = obj.mode;
    this.galaxyURL = obj.galaxyURL;
    this.apiKey = obj.apiKey;
    this.query = obj.query;
    this.blastProxy = obj.blastProxy;

    var Transformer = require("./transformer"),
        View = require("./view");

    this.getTransformer = function(){
        return Transformer;
    }
    this.getView = function(){
        return View;
    }
}

Vapor.prototype.run = function(){
    if(this.mode === "example"){
        runExample(this);
    }
    else {
        runFull(this);
    }
}

function runFull(vapor){
    var geneIds, wait,
        Transformer = vapor.getTransformer(),
        View = vapor.getView(),
        t = new Transformer(vapor.query),
        cParser = require("biojs-io-clustal"),
        _ = require("underscore"),
        vaporObj = {};

    //Run data transformation operations
    //First we need to BLAST the query
    t.blastSearch(vapor.blastProxy, function(fasta){
        // run clustal
        t.runClustal({
            galaxyURL: vapor.galaxyURL,
            apiKey: vapor.apiKey,
            browser: true,
            file: fasta
        }, function(cOut){
            vaporObj.msa = cParser.parse(cOut.clustal.replace(/[\:\.\*]/g, ""));
            vaporObj.phylotree = tnt.tree.parse_newick(t.shortTreeIDs(t.treeFromLog(cOut.log)));
        });

        //get String db data
        //TODO: fix proxy handing
        geneIds = t.idsFromFasta(fasta);
        t.getSTRINGNetworks(geneIds, "localhost:9000/", function(nets){
            vaporObj.interactions = nets;
            geneIds = geneIds.concat(t.extractNetworkIDs(nets));
            geneIds = _.uniq(geneIds);
            //get Swissport data
            t.getGeneInfo(geneIds, vapor.blastProxy, function(swissprot){
                vaporObj.anno = swissprot;
            });
        });

        wait = setInterval(function(){
            if(vaporObj.msa !== undefined &&
                vaporObj.phylotree !== undefined &&
                vaporObj.interactions !== undefined &&
                vaporObj.anno !== undefined){

                clearInterval(wait);
                console.log(vaporObj);

                req({
                    uri: galaxyProxy + restURL + "/queries",
                    method: "POST",
                    json: vaporObj
                }, function(err, res, body){
                    console.log("Query was saved to server");
                });

                v = new View(vaporObj);
                v.init();
                v.render();
            }
            else {
                console.log("Waiting for data ...");
                console.log(vaporObj);
            }
        }, 10000);
    });
}

function runExample(vapor){
    var vaporData = require("./example-struct"),
        Transformer = vapor.getTransformer(),
        View = vapor.getView(),
        t = new Transformer("");

    vaporData.phylotree = tnt.tree.parse_newick(t.shortTreeIDs(vaporData.phylotree));
    v = new View(vaporData);
    v.init();
    v.render();
}
