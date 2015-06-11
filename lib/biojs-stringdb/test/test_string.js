var assert = require("assert");
var StringDB = require("../js/string");

describe("StringDB", function(){
    it("should be initialised properly", function(done){
        var sdb = new StringDB();

        assert.equal(sdb.db, "string-db.org");
        assert.equal(sdb.access, "api");
        assert.equal(sdb.format, "psi-mi-tab");
        assert.equal(sdb.request, "interactions");
    
        done();
    });

    describe("getNetwork", function(){
        it("should not throw an error", function(done){
            var sdb = new StringDB();
            assert.doesNotThrow(function(){
                sdb.getNetwork("CDC15", "");
            });

            done();
        });
    });

    describe("networkToJSON", function(){
        it("should convert the tsv to JSON correctly", function(done){
            var sdb = new StringDB();
            sdb.getNetwork("CDC15", "").then(function(tsv){
                var asJson = sdb.networkToJSON(tsv);
                assert.ok(asJson.nodes !== undefined);
                assert.ok(asJson.edges !== undefined);
                assert.ok(asJson.edges.length === 32);
                assert.ok(asJson.nodes.length === 11);

                done();
            });
        });
    });
});