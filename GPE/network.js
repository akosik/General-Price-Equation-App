///////////////////////////////////////
/* General Price Equation Visual Aid */
///////////////////////////////////////

var network;

function destroy(network) {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function draw() {
    network = null;
    var data = null;
    destroy(network);
    var nodes = [];
    var edges = [];

    // create a network
    var container = document.getElementById('mynetwork');
    var wnodeCount1 = document.getElementById('wnodeCount1').value;
    var bnodeCount1 = document.getElementById('bnodeCount1').value;
    var wnodeCount2 = document.getElementById('wnodeCount2').value;
    var bnodeCount2 = document.getElementById('bnodeCount2').value;
    var wparentCount = document.getElementById('wparentCount').value;
    var bparentCount = document.getElementById('bparentCount').value;

    if(wparentCount > wnodeCount1 || bparentCount > bnodeCount1) {
        alert("There are too many parents for the current number of ancestors. \n \n Please change one of these values.");
        return null;
    }

    //Create Ancestors
    for(var i = 0; i < wnodeCount1; i++) {
        nodes.push({id: 'aw' + i, borderWidth: 3, level: 0, color: {background: 'white', border:'black'}});
    }

    for(var i = 0; i < bnodeCount1; i++) {
        nodes.push({id: 'ab' + i, level: 0, color: {background: 'black', border: 'black'}});
    }


    //Create Children and Edges
    for(var i = 1; i <= wnodeCount2; i++) {
        var descendant = 'dw' + i;
        nodes.push({id: descendant, borderWidth: 3, level: 1, color: {background: 'white', border: 'black'}});
        for(var k = 0; k < wparentCount; k++) {
            var parent =  'aw' + ((k + i) % wnodeCount1);
            edges.push({from: parent, to: descendant, arrows: 'to'});
        }
    }
    for(var i = 1; i <= bnodeCount2; i++) {
        var descendant = 'db' + i;
        nodes.push({id: descendant, level: 1, color: {background: 'black', border: 'black'}});
        for(var k = 0; k < bparentCount; k++) {
            var parent =  'ab' + ((i + k) % bnodeCount1);
            edges.push({from: parent, to: descendant, arrows: 'to'});
        }
    }

    //Encapsulate Data and Options for Vis.js network creation
    data = {nodes: nodes, edges: edges};

    var options = {
        layout: {
            hierarchical: {
                direction: "UD",
            }
        },

        manipulation: {
            addNode: false,
            deleteNode: false,
            addEdge: function (data, callback) {
                if (data.from == data.to) {
                    var r = confirm("Do you want to connect the node to itself?");
                    if (r == true) {
                        callback(data);
                    }
                }
                else return null;
                data.arrows = 'to';
                edges.push(data);
                calculate(nodes, edges);
            },
            deleteEdge: function(data, callback) {
                for(edge in edges) {
                    if(edges[edge].id == data.edges[0]) edges.splice(edge,1);
                }
                callback(data)
                calculate(nodes, edges);
            },
            editEdge: function(data, callback) {
                callback(data);

                //Remove Former Edge
                for(edge in edges) {
                    if(edges[edge].id == data.id) edges.splice(edge, 1);
                }

                //Add new Edge
                data.arrows = 'to';
                edges.push(data);
                calculate(nodes, edges);
            }
        },
        interaction: {selectConnectedEdges: true}
    };
    network = new vis.Network(container, data, options);
    calculate(nodes, edges);
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
//Calculate GPE terms
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

function calculate(nodes, edges) {

    var wnodeCount1 = document.getElementById('wnodeCount1').value;
    var bnodeCount1 = document.getElementById('bnodeCount1').value;
    var wnodeCount2 = document.getElementById('wnodeCount2').value;
    var bnodeCount2 = document.getElementById('bnodeCount2').value;
    var wparentCount = document.getElementById('wparentCount').value;
    var bparentCount = document.getElementById('bparentCount').value;

    //Total Number of Ancestors and Descendants
    var n_a = Number(wnodeCount1) + Number(bnodeCount1);
    var n_d = Number(wnodeCount2) + Number(bnodeCount2);

    var connTotal = edges.length;

    ////////////////////////////////////////////////////////////
    //Cbar_a calculations
    ////////////////////////////////////////////////////////////
    var connPerAncestor = connTotal/n_a;
    var Cbar_a = [];

    //This works because white nodes are always added before black nodes
    //To do: make this calculation work no matter what order the array of nodes is created in

    //Connections per ancestor (White)
    for(var j = 0; j < wnodeCount1; j++) {
        Cbar_a.push(0);
        for(i in edges) {
            if(edges[i].from == ('aw' + j.toString()) ) Cbar_a[j]++;
        }
    }
    //Connections per ancestor (Black)
    for(var j = 0; j < bnodeCount1; j++) {
        Cbar_a.push(0);
        for(i in edges) {
            if(edges[i].from == ('ab' + j.toString()) ) Cbar_a[Number(wnodeCount1) + j]++;
        }
    }
    //Ratio of Connections per ancestor for a specific ancestor to Overall Connections per ancestor
    Cbar_a = Cbar_a.map(function(x) {return x / connPerAncestor; });

    //Character (White or black / 0 or 1) of each ancestor
    var X_a =[];
    var j = 0;
    for(i in nodes) {
        if(nodes[i].level == 0) {
            if(nodes[i].color.background == 'black') X_a[j] = 1;
            else X_a[j] = 0;
            j++;
        }
    }

    //Average of ratios of connections per ancestor for sepcific ancestor to Overall connections per ancestor
    var sum = 0;
    for(var i = 0; i < Cbar_a.length; i++) sum = sum + Cbar_a[i];
    var meanCbar_a = sum / Cbar_a.length;


    //Average character of ancestors
    var meanX_a = Number(bnodeCount1) / X_a.length;

    //Covariance of Cbar_a and X_a
    sum = 0;
    for(var i = 0; i < Cbar_a.length; i++) sum += (Cbar_a[i] - meanCbar_a) * (X_a[i] - meanX_a);
    var term1 = sum / Cbar_a.length;

    ///////////////////////////////////////////////////////////////
    //Cbar_d calculations
    //////////////////////////////////////////////////////////////

    var Cbar_d = [];
    for(var j = 1; j <= Number(wnodeCount2); j++) {
        Cbar_d.push(0);
        for(i in edges) {
            if(edges[i].to == ('dw' + j.toString()) ) Cbar_d[j-1]++;
        }
    }

    for(var j = 1; j <= Number(bnodeCount2); j++) {
        Cbar_d.push(0);
        for(i in edges) {
            if(edges[i].to == ('db' + j.toString()) ) Cbar_d[Number(wnodeCount2) + j-1]++;
        }
    }
    var connPerDescendant = connTotal/n_d;
    Cbar_d = Cbar_d.map(function(x) {return x / connPerDescendant; });

    var X_d =[];
    var j = 0;
    for(i in nodes) {
        if(nodes[i].level == 1) {
            if(nodes[i].color.background == 'black') X_d[j] = 1;
            else X_d[j] = 0;
            j++;
        }
    }

    //Average of ratios of connections per descendant for specific ancestor to Overall connections per descendant
    sum = 0;
    for(var i = 0; i < Cbar_d.length; i++) sum = sum + Cbar_d[i];
    var meanCbar_d = sum / Cbar_d.length;


    //Average character of ancestors
    var meanX_d = Number(bnodeCount2) / X_d.length;

    //Covariance of Cbar_a and X_a
    sum = 0;
    for(var i = 0; i < Cbar_d.length; i++) sum += (Cbar_d[i] - meanCbar_d) * (X_d[i] - meanX_d);
    var term3 = sum / Cbar_d.length;

    /////////////////////////////////////////////////////////////////
    //Delta Xbar
    /////////////////////////////////////////////////////////////////
    var Xbar_a = bnodeCount1 / n_a;
    var Xbar_d = bnodeCount2 / n_d;
    var deltaXbar = Xbar_d-Xbar_a;


    /////////////////////////////////////////////////////////////////
    //Term 2 (Calculated from Terms 1, 3 and Delta Xbar)
    /////////////////////////////////////////////////////////////////
    //Calculate term 2 and round to zero if its less than 3 sig figs
    var term2 = deltaXbar - term1 + term3;
    if(Math.abs(term2) < .001) term2 = 0;

    //truncate all terms to 3 sig figs
    term1 = term1.toFixedDown(3);
    term2 = term2.toFixedDown(3);
    term3 = term3.toFixedDown(3);
    deltaXbar = deltaXbar.toFixedDown(3);

    //Display terms
    document.getElementById('1stTerm').innerHTML = term1;
    document.getElementById('2ndTerm').innerHTML = term2;
    document.getElementById('3rdTerm').innerHTML = term3;
    document.getElementById('deltaXbar').innerHTML = deltaXbar;
    document.getElementById('xbard').innerHTML = Xbar_d;
    document.getElementById('xbara').innerHTML = Xbar_a;


}

//truncate to 3 sig figs
Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("([-+]?\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

//refit network within canvas element
function fit() {
    if(network !== null) network.fit();
}
