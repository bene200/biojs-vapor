var View = module.exports = function(data){
    this.vaporObj = data;
    this.msa = null;
    this.tree = null;
    this.cyto = null;
}

View.prototype.init = function(){
    this.tree = initTree(this.vaporObj.phylotree);
    this.msa = initMsa(this.vaporObj.msa);
    
    arrangeMsaTree(this.tree, this.msa)
    setEvents(this.tree, this.msa, this.vaporObj);
}

function initTree(newick){
    var treeVis = tnt.tree().data(newick);
    treeVis
        .label(tnt.tree.label.text().height(20))
        .layout(tnt.tree.layout.vertical()
            .width(550)
            .scale(true));
    return treeVis;
}

function arrangeMsaTree(tree, msa){
    //set msa ids to match with the tree
    var leaves = tree.root().get_all_leaves(),
        newIds = [],
        element = null;
        oldId = null;
    
    //loop through all leaves and search msa ids for mathches
    //remember old ids and new ids of msa matches
    for(var i=0; i<leaves.length; i++){
        element = msa.seqs.filter(function(el) { return leaves[i].data().name.indexOf(el.get('name')) !== -1; });
        if(element !== null && element.length !== 0){
            if(element.length > 1){
                if(element[0].get("id").toString().length > 2){
                    oldId = element[0].get("id");
                }
                else {
                    oldId = element[1].get("id");
                }
            }
            else {
                oldId = element[0].get("id");
            }
            newIds.push({
                oldid: oldId,
                newid: i
            });
        }
        else {
            element = msa.seqs.filter(function(el) { return leaves[i].data().name.indexOf(el.get('name')) !== -1; })[0];
            newIds.push({
                oldid: element.get("id"),
                newid: i
            })
        }
    }
    //change msa ids according to newIds
    for(var i=0; i<newIds.length; i++){
        element = msa.seqs.filter(function(el){ return el.get('id') === newIds[i].oldid });
        element[0].set('id', newIds[i].newid);
    }
    msa.seqs.comparator = "id";
    msa.seqs.sort();

    //fix msa names
    for(var i=0; i<leaves.length; i++){
        leaves[i].data().vaporId = i;
        msa.seqs.at(i).set("name", leaves[i].data().name);
    }
}

function initMsa(clustal){
    var msa = require("msa"),
        msaDiv = document.getElementById("msa"),
        opts = {},
        m = null;
    
    opts = {
        el: msaDiv,
        seqs: clustal,
        vis: {
            conserv: false,
            overviewbox: false,
            seqlogo: false,
            metacell: false
        },
        zoomer: {
            labelIdLength: 20,
            rowHeight: 20,
            alignmentHeight: 420
        }
    };
    m = msa(opts);
    return m;
}

function setEvents(tree, msa, data){
    var m = require("msa"),
        hide = null,
        names = [],
        id = "";

    var msaHide = function(node, val){
        //hides sequences in msa depending on phylogenetic tree
        hide = node.get_all_leaves();
        names = [];
        for(var i=0; i<hide.length; i++){
            if(hide[i].data().name !== ""){
                msa.seqs.at(hide[i].data().vaporId).set("hidden", val);
            }
        }
    };

    var treeClick = function(node){
        if(node.is_leaf()){
            if(node.is_collapsed()){
                node.toggle();
                tree.update();
                msaHide(node, false);
            }
            else {
                //if leave is clicked show interaction network
                id = node.data().name;
                msa.g.selcol.reset();
                msa.g.selcol.add(new m.selection.rowsel({seqId: node.data().vaporId}));
                showInteractions(id, data);
                showInformation(id, data);
            }
        }
        else {
            msaHide(node, true);
            node.toggle();
            tree.update();
        }
    };
    tree.on_click(treeClick);
}

function showInformation(id, data){
    var _ = require("underscore"),
        info = _.filter(data.anno, function(el){
            var flag = false;
            if(el !== null){
                flag =  (el.query.indexOf(id) !== -1);
            }
            return flag; 
        })[0],
        infoHtml = null,
        html = null,
        div = document.getElementById("gene-info");
    
    if(info !== undefined){
        infoHtml = [
            { name: "Organism", entry: info.os },
            { name: "Gene name", entry: info.gene },
            { name: "Annotation", entry: info.func },
            { name: "GO Terms", entry: info.goterms.join("<br>") }
        ]
    }
    else {
        infoHtml = [
            { name: "Organism", entry: "No data" },
            { name: "Gene name", entry: "No data" },
            { name: "Annotation", entry: "No data" },
            { name: "GO Terms", entry: "No data" }
        ]
    }
    html = tableFromObj(infoHtml);
    div.innerHTML = html;
}

function tableFromObj(info){
    var obj = null,
        html = '<table class="table-bordered" id="info-table">';
    
    for(var i=0; i<info.length; i++){
        obj = info[i];
        html += '<tr>';
        html += '<td>';
        html += obj.name;
        html += '</td>';
        html += '<td>';
        html += obj.entry;
        html += '</td>';
        html += '</tr>';
    }
    html += '</table>';

    return html;
}

function showInteractions(id, data){
    
    var _ = require("underscore"),
        net = {},
        nodes = [],
        edges = [],
        query = id + "H";

    console.log(data.interactions);
    net = _.filter(data.interactions, function(el){
        return el.id === query;
    })[0].graph;
    //convert data to proper cytoscape format
    //nodes
    for(i=0; i<net.nodes.length; i++){
        if(net.nodes[i].name.toUpperCase() === query.replace(/_ARATH/g, "").toUpperCase()){
            net.nodes[i].color = "red";
        }
        else {
            net.nodes[i].color = "grey";
        }
        nodes.push({ data: net.nodes[i] });
    }
    //edges
    for(i=0; i<net.edges.length; i++){
        edges.push({ data: net.edges[i] });
    }
    //cytoscape element
    var el = document.getElementById('cy')
    el.innerHTML = "";
    
    //display network
    $('<div style="z-index:9;position:relative;height:500px;width:100%;"></div>')
        .appendTo('#cy')
        .cytoscape({
            style: cytoscape.stylesheet()
                .selector('node')
                .css({
                    'content': 'data(id)',
                    'background-color': 'data(color)'
                })
                .selector('edge')
                .css({
                    'width': 4,
                    'line-color': '#ddd',
                    'target-arrow-color': '#ddd'
                }),

            elements: {
                nodes: nodes,
                edges: edges
            },

            layout: {
                name: 'cose',
                nodeRepulsion: 800000,
                directed: false
            },

            zoomingEnabled: false,

            ready: function(){
                this.center();
                this.fit();
                this.on('tap', function(evt){
                    var node = evt.cyTarget;
                    showInformation(node.id(), data);
                });
            }
        });
};

function searchEntry(acc, data){
    var entry = {};
    for(var i=0; i<data.length; i++){
        if(acc.indexOf(data[i].acc) !== -1){
            entry = data[i];
            break;
        } 
        else {
            continue;
        }
    }
    return entry;
}

View.prototype.render = function(){
    var treeDiv = document.getElementById("tnt");
    treeDiv.innerHTML = "";
    this.tree(treeDiv);
    this.msa.render();
}

module.exports = View;