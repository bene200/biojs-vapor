var Blast = function(params){
    //init instance variables
    var seq = params.query,
        program = params.p || "blastp",
        database = params.d || "nr",
        entrezQuery = params.entrezQuery || undefined,
        proxyURL = params.proxy || undefined,
        megablast = params.megablast || false;
        jobId = "",
        out = "";  

    //check if they are valid
    try{
        checkInput();
    } catch(e) {
        throw e;
    }

    //getter and setter functions
    this.getSequence = function(){
        return seq;
    }
    this.getProgram = function(){
        return program;
    };
    this.getDatabase = function(){
        return database;
    };
    this.getStype = function(){
        return stype;
    };
    this.getProxyURL = function(){
        return proxyURL;
    };
    this.getOutput = function(){
        return out;
    };
    this.getEntrezQuery = function(){
        return entrezQuery;
    };
    this.setSequence = function(newSeq){
        seq = newSeq;
    };
    this.setProgram = function(prgrm){
        program = prgrm;
    };
    this.setDatabase = function(db){
        database = db;
    };
    this.setStype = function(st){
        stype = st;
    };
    this.setProxyURL = function(url){
        proxyURL = url;
    };
    this.setEntrezQuery = function(eq){
        entrezQuery = eq;
    };

    this.search = function(callback){
        //performs the BLAST search
        var request = require("request");
        var blastURL = "http://www.ncbi.nlm.nih.gov/blast/Blast.cgi/";
        if(proxyURL !== undefined){
            blastURL = proxyURL + blastURL;    
        }
        var cmd = buildPutRequest();
        var query = blastURL + cmd;

        //put request
        request(query, function(a, b, response){
            var index = response.search("RID = ") + 6;
            //get request id
            var rid = response.substring(index, index + 12);
            jobId = rid;
            var cmdGet = "?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=" + rid;
            //check for results, if not ready continue searching
            //if ready write to instance variable
            var interval = setInterval(function(){
                request(blastURL + cmdGet, function(a, b, response){
                    if(response.indexOf("Status=WAITING") >= 0){
                        console.log("Searching ....");
                    }
                    else {
                        request(blastURL + "?CMD=Get&FORMAT_TYPE=XML&RID=" + rid, function(a, b, re){
                            out = re;
                            callback();
                        });
                        clearInterval(interval);
                    }
                });
            }, 5000);
        });
    };

    this.asFasta = function() {
        //transforms 
        var xml = out;
        var begin = findAll(/<Hit_id/gi, xml);
        var end = findAll(/<\/Hit_id/gi, xml);
        var beginSeq = findAll(/<Hsp_hseq/gi, xml);
        var endSeq = findAll(/<\/Hsp_hseq/gi, xml);
        var fasta = seq.trim() + "\n";
        for(var i=0; i<begin.length; i++){
            fasta += ">" + xml.substring(begin[i]+8, end[i]-1) + "\n" 
                + xml.substring(beginSeq[i]+10, endSeq[i]-1) + "\n";
        }
        return fasta;
    };

    function findAll(regex, file){
        var result;
        var ind = [];
        while ( (result = regex.exec(file)) ) {
            ind.push(result.index);
        }
        return ind;
    };

    function checkInput(){
        //check proxy
        if(proxyURL !== undefined){
            var request = require("request");
            request(proxyURL + "http://www.ncbi.nlm.nih.gov/blast/Blast.cgi", function(a, b, response){
                if(response === undefined){
                    throw new Error("bad proxy: " + a.message);
                }
            });
        }

        //check input seq
        if(typeof seq !== "string"){
            throw new Error("sequence not of type string");
        }
        var head = seq.match(">.+\n");
        if(head === null){
            throw new Error("fasta input needs to have a header");
        }
        if(head.length > 1){
            throw new Error("you can only have one input sequence");
        }
        //check program
        var validPrograms = ["blastn", "blastp", "blastx", "tblastn", "tblastx"];
        if(validPrograms.indexOf(program) === -1){
            throw new Error("invalid program");
        }

        //check database
        var validDbs = ["nr", "est_human", "est_mouse", "est_others",
                    "htg", "gss", "sts", "pataa", "patnt", "swissprot",
                    "est", "pdb", "month", "mont.nt", "month.est", "month.gss",
                    "month.htgs", "month.sts", "month.pataa", "month.patnt",
                    "chromosome"];
        if(validDbs.indexOf(database) === -1){
            throw new Error("invalid database");
        }

        //check megablast
        if(typeof megablast !== "boolean"){
            throw new Error("megablast parameter needs to be of type boolean");
        }
    };

    function buildPutRequest(){
        //mandatory parameters
        var cmd ="?CMD=Put&QUERY=" + encodeURIComponent(seq) 
                + "&DATABASE=" + database
                + "&PROGRAM=" + program;

        //optional parameters
        if(megablast){
            cmd += "&MEGABLAST=true";
        }
        if(entrezQuery !== undefined){
            cmd += "&ENTREZ_QUERY=" + encodeURIComponent(entrezQuery);
        }
        return cmd;
    };
};
module.exports = Blast; 