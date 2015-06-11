//Mocha unit tests using a local Galaxy instance

var assert = require("assert");
var fs = require("fs");
var Galaxy = require("../lib/galaxy");

describe("GalaxyJS", function(){
    var apiKey = "0a53aa0a95b3519f5159a9b36a7442f3";
    var baseUrl = "http://localhost:8000/";
    var g = new Galaxy(baseUrl, apiKey);

    describe("getters", function(){
        assert.equal(g.getGalaxyUrl(), baseUrl);
        assert.equal(g.getApiKey(), apiKey);
    });

    describe("setters", function(){
        g.setApiKey("testval");
        assert.equal(g.getApiKey(), "testval");
        g.setGalaxyUrl("testval");
        assert.equal(g.getGalaxyUrl(), "testval");

        g.setGalaxyUrl(baseUrl);
        g.setApiKey(apiKey);
    });

    describe("#createHistory()", function(){
        it("should create a new history with specified name", function(done){
            g.createHistory("test_hist", function(response){
                assert.equal(response.name, "test_hist");
                assert.ok(response.id !== "");
                histId = response.id;
            });
            done();
        });
    });

    //TODO: Describe delete workflow

    describe("#uploadToHistory()", function(){
        it("should upload a file from a string to a specified history", function(done){
            g.createHistory("test_hist", function(response){
                var fasta = ">dummy\nACATCGATCGATCGATCGTACGTACGATCG";
                g.uploadToHistory(fasta, "upload_test.fa", response.id, function(respInner){
                    assert.ok(respInner.outputs.length !== 0);
                    assert.ok(respInner.outputs[0].id !== "");
                    assert.equal(respInner.outputs[0].history_id, histId);
                });
            });
            done();
        });
    });

    describe("#executeWorkflow()", function(){
        it("should execute a workflow make outputs accessible", function(done){
            var inputId = "f2db41e1fa331b3e";
            var workflowId = "ebfb8f50c6abde6d";
            var historyId = "f597429621d6eb2b";
            g.executeWorkflow(inputId, workflowId, historyId, function(resp){
                var output = resp.outputs;
                assert.ok(output.length >= 1);
            });
            done();
        });
    });

    describe("#getDatasetContent()", function(){
        it("should download the content of a file into a string", function(done){
            var inputId = "f2db41e1fa331b3e";
            g.getDatasetContent(inputId, function(resp){
                assert.ok(resp !== undefined);
            })
            done();
        })
    })
});
