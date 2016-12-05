"use strict"

var CallType = {
    PERFORM: 1,
    CALL: 2,
    CICS_LINK: 3
};


var NodeType = {
    PROCEDURE: 1,
    BATCH_PROGRAM: 2,
    ONLINE_PROGRAM: 3,
    DYNAMIC: 4
};


// ************************************  Load Local file *********************************************
(function(d){
   var $input = {
      input: null,
	  get: function() {
	    var localReference = this;
	    if(this.input == null) {
		   this.input = d.createElement("input");
		   this.input.style = "display: none";
		   this.input.type = "file";
		   this.input.onchange = function() {localReference.loadText();};
		   d.body.appendChild(this.input); 
		}
		return this.input;
	  },
	  click: function() {
	    this.get().click();
	  },
	  loadText : function(callback) {	    
        var reader = new FileReader();
		var localReference = this;
		var text = "";
		var loadCount = 0;
		var callb = callback || this.callback;
        reader.onload = function() {
          text += reader.result; 
		  if(++loadCount >= localReference.get().files.length)
            callb.call(this, text);		  
        };
        for(var i in localReference.get().files) {
		  console.log(localReference.get().files[i]);
		  if(localReference.get().files[i].size)
            reader.readAsText(localReference.get().files[i]);
		}
	  }
   };
   var loadText = function(callback) {
      $input.callback = callback;
      $input.click();
   }
   
   window.loadLocalFile = loadText;
})(document);

// ***************************************************************************************************

/**
 * Regular expressions for parsing some Cobol constructs using Bradesco code conventions.
 * FIXME: The FIELD_RE support only fields with a VALUE clause added in the same line.
**/

// TODO  CALL WRK-PROGRAMA           USING WRK-AREA-CMCT6J59

var DIVISION_BEGIN_RE = /^ {7}([A-Z0-9-]+) +DIVISION *\. */;
var SECTION_BEGIN_RE  = /^ {7}([A-Z0-9-]+) +SECTION *\. */;
var MOVE_RE           = /^ {7} +MOVE +['"]([A-Z0-9_-]+)['"] +TO ([A-Z0-9_-]+) */;
var PROCEDURE_DIVISION_BEGIN_RE = /^ {7}PROCEDURE +DIVISION *\. */;
var PROGRAM_ID_RE     = /^ {7}PROGRAM\-ID\. +([A-Z0-9]+)\. */;
var FIELD_RE          = /^ {7} +[0-9]+ +([A-Z0-9-]+) +PIC.* VALUE ["']([A-Z0-9-]+)["']\..*/;
var PROC_BEGIN_RE     = /^ {7}([0-9]+)-([A-Z0-9-]+) +SECTION\. */;
var PROC_EXIT_RE      = /^ {7}([0-9]+)-99-FIM\. +EXIT\. */;                      
var PERFORM_RE        = /^ {7} +PERFORM +([0-9]+)-([A-Z0-9-]+)/;
var CALL_RE           = /^ {7} +CALL ([A-Z0-9_-]+).*/;
var CICS_BEGIN_RE     = /^ {7} +EXEC +CICS +LINK */;
var CICS_PROGRAM_RE   = /^ {7} +PROGRAM +\(? *([A-Z0-9-]+) *\)? */;
var CICS_EXIT_RE      = /^ {7} +END-EXEC */;


/**
 *  Parses Cobol source code and returns a perform call graph.
**/
function parseCallGraph(code, duplicate_calls=true, program_name=false, replace_fields={}) {
    let graph = {
        nodes: [],
        edges: []
    };
    
    let lineno = 0;
    code = code.split('\n');
    
    function match(re) {
	    var line = code[lineno];
        return re.exec(line);
    }
    
    function pushNode(id, type, data={}) {
        let node_ids = graph.nodes.map(n => {
            return n.id
        });
        if (node_ids.indexOf(id) == -1) {
            graph.nodes.push({
                id: id,
                type: type,
                data: data
            });
        }
    }
    
    function pushEdge(source, target, type) {
        let contains = false;
        graph.edges.forEach(e => {
            if (e.source == source && e.target == target) {
                contains = true;
            }
        });
        if (!contains || duplicate_calls) {
            graph.edges.push({
                source: source,
                target: target,
                type: type
            });
        }
    }
    
    // Line by line
    let program;
    
    while (lineno < code.length) {
        let matches;
        let fields;
		if(code[lineno].trim().startsWith("*")) {
		   lineno++;
		   continue;
		}
        
        if ((matches = match(PROGRAM_ID_RE)) != null) {
            program = matches[1];
        }
        
        // Begining of a procedure
        if ((matches = match(PROC_BEGIN_RE)) != null) {
            fields = {};
            console.assert(program !== undefined);
            
            let pnum = matches[1];
            let pname = matches[2];
            let proc = `${pnum}-${pname}`;
            if (program_name) {
                proc = `[${program}] ${proc}`;
            }
            
            // Iter the procedure line by line
            while (true) {
                
                // End of procedure found
                if ((matches = match(PROC_EXIT_RE)) != null) {
                    let epnum = matches[1];
                    console.assert(pnum == epnum);
                    ++lineno;
                    break;
                }
                
                // MOVE command found
                else if ((matches = match(MOVE_RE)) != null) {
                    let value = matches[2];
                    let fieldname = matches[1];
                    if (!(fieldname in fields)) {
                        fields[fieldname] = [];
                    }
                    fields[fieldname].push(value);
                }
                
                // Perform found
                else if ((matches = match(PERFORM_RE)) != null) {
                    let ppnum = matches[1];
                    let ppname = matches[2];
                    let pproc = `${ppnum}-${ppname}`;
                    if (program_name) {
                        pproc = `[${program}] ${pproc}`;
                    }
                    pushNode(pproc, NodeType.PROCEDURE);
                    pushEdge(proc, pproc, CallType.PERFORM);
                }
                
                // Batch call found
                else if ((matches = match(CALL_RE)) != null) {
                    let cname = matches[1];
                    if (cname in replace_fields) {
                        cname = replace_fields[cname];
                    }
                    pushNode(cname, NodeType.BATCH_PROGRAM);
                    pushEdge(proc, cname, CallType.CALL);
                }
                
                // Begining of an online call found(EXEC)
                else if ((matches = match(CICS_BEGIN_RE)) != null) {
                    
                    // Iter the EXEC block line by line
                    while (true) {
                        // End of EXEC found
                        if ((matches = match(CICS_EXIT_RE)) != null) {
                            ++lineno;
                            break;
                        }
                        
                        // Called program name found
                        else if ((matches = match(CICS_PROGRAM_RE)) != null) {
                            let pname = matches[1];
                            if (pname in replace_fields) {
                                pname = replace_fields[pname];
                            }
                            pushNode(pname, NodeType.ONLINE_PROGRAM);
                            pushEdge(proc, pname, CallType.CICS_LINK);
                        } 
                        ++lineno;
                    }
                }
                ++lineno;
            }
            pushNode(proc, NodeType.PROCEDURE, {fields: fields});
        }
        console.log(graph.nodes);
        ++lineno;
    }
    return graph;
}


/**
 * Parses some fields and its values.
**/
function parseFields(code) {
    code = code.split('\n');
    let lineno = 0;
    let fields = {};
    let matches;
    while (lineno < code.length) {
        if ((matches = FIELD_RE.exec(code[lineno])) != null) {
            let field = matches[1];
            let value = matches[2];
            fields[field] = value;
        }
        ++lineno;
    }
    return fields;
}


/**
 * Produces a .dot file from a graph
**/
function generateDotFile(graph) {
    let dot = [
        'digraph call {',
        'size="6,4"; ratio = fill;',
        'graph [ordering="out"];',
        'node [style=filled]'
    ];
    
    graph.edges.forEach(e => {
        let color;
        switch (e.type) {
            case CallType.PERFORM:   color = '0.650 0.700 0.700'; break;
            case CallType.CALL:      color = '0.348 0.839 0.839'; break;
            case CallType.CICS_LINK: color = '0.515 0.762 0.762'; break;
            default:                 console.assert(false); 
        }
        dot.push(`"${e.source}" -> "${e.target}" [color="${color}"];`);
    });
    
    graph.nodes.forEach(n => {
        console.log(n.id, n);
        let color;
        switch (n.type) {
            case NodeType.PROCEDURE:      color = '0.650 0.200 1.000'; break;
            case NodeType.BATCH_PROGRAM:  color = '0.201 0.753 1.000'; break;
            case NodeType.ONLINE_PROGRAM: color = '0.499 0.386 1.000'; break;
            default:                      console.assert(false);
        }
        dot.push(`"${n.id}" [color="${color}"];`);
    });
    dot.push('}');
    return dot.join('\n');
}
