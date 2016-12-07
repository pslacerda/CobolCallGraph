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
/**
 * This constant when seted to true will alow to all debug messages be printed on webbrowser console.
 */
const IS_DEBUG = true;

/**
 * Indicates the max number of lines per procedure acepted to avoid infinit loop.
 */
const PROCEDURE_MAX_LINE=10000;

const messages = {
    max_line_per_procedure: "Syntax Exception - Max line number per procedure raised",
    lines_of_code: "lines of code finded.",
    program_name_finded: "Program name finded on line",
    procedure_begin: "Starting procedure",
    procedure_exit: "Exiting procedure",
    stargin_cics: "Starting an cics call",
    syntax_error: "Syntax error",
};

/**
 * Use this function instead console.log to keep control on when debug messages should be printed on console.
 */
function debug() {
   if(IS_DEBUG) {
     let text = '';
     for(let i in arguments) {
        text += ' ' + arguments[i];
     }
     console.log(text);
   }
}

/**
 * Regular expressions for parsing some Cobol constructs using some code conventions.
 * FIXME: The FIELD_RE support only fields with a VALUE clause added in the same line.
 */
// TODO  CALL WRK-PROGRAMA           USING WRK-AREA-CMCT6J59
const DIVISION_BEGIN_RE = /^ *([\w0-9-]+) +DIVISION *\. */i;
const SECTION_BEGIN_RE  = /^ *([\w0-9-]+) +SECTION *\. */i;
const MOVE_RE           = /^ *MOVE +['"]([\w0-9_-]+)['"] +TO ([\w0-9_-]+) */i;
const PROCEDURE_DIVISION_BEGIN_RE = /^ {7}PROCEDURE +DIVISION *\. */i;
const PROGRAM_ID_RE     = /^ *PROGRAM\-ID\. +([\w0-9]+)\. */i;
const FIELD_RE          = /^ *[0-9]+ +([\w0-9-]+) +PIC.* VALUE ["']([\w0-9-]+)["']\..*/i;
const PROC_BEGIN_RE     = /^ *([^ ]+) +SECTION\. */i;
const PROC_EXIT_RE      = /^ *([^ ]+)+\. */i;
const PERFORM_RE        = /^ *PERFORM +([^ ]+)/i;
const CALL_RE           = /^ *CALL ([^ ]+).*/i;
const CICS_BEGIN_RE     = /^ *EXEC +CICS +LINK */i;
const CICS_PROGRAM_RE   = /^ *PROGRAM +\(? *([\w0-9-]+) *\)? */i;
const CICS_EXIT_RE      = /^ *END-EXEC */i;
// ***************************************************************************************************

/**
 *  Parses Cobol source code and returns a perform call graph.
 */
function parseCallGraph(code, duplicate_calls=true, program_name=false, replace_fields={}) {
    let graph = {
        nodes: [],
        edges: []
    };
    
    let lineno = 0;
    code = code.split('\n');
    debug(code.length, messages.lines_of_code);
    
    function match(re) {
        var line = code[lineno];
        return re.exec(line);
    }
    
    let registeredIds = {}; // improve performance for large source files
    function pushNode(id, type, data={}) {
        if (registeredIds[id] === true) {
            return;
        } else {
            registeredIds[id] = true;
            graph.nodes.push({
                id: id,
                name: id,
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
        if(code[lineno].substring(6, 7) === "*") { // TODO: fix comment 
           lineno++;
           continue;
        }
        
        if ((matches = match(PROGRAM_ID_RE)) != null) {
            program = matches[1];
            debug(messages.program_name_finded, lineno + 1, program);
        } 
        
        // Begining of a procedure
        else if ((matches = match(PROC_BEGIN_RE)) != null) {
            fields = {};
            console.assert(program !== undefined);
            
            let pname = matches[1];
            let proc = pname;
            if (program_name) {
                proc = `[${program}] ${proc}`;
            }
            debug(messages.procedure_begin, proc);
            
            let infinitLoopController = 0;
            // Iter the procedure line by line
            while (true) {
                if (++infinitLoopController > PROCEDURE_MAX_LINE) throw messages.max_line_per_procedure;

                // End of procedure found
                if ((matches = match(PROC_EXIT_RE)) != null) {
                    ++lineno;
                    debug(messages.procedure_exit, proc);
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
                    let ppname = matches[1];                    
                    if (program_name) {
                        ppname = `[${program}] ${ppname}`;
                    }
                    pushNode(ppname, NodeType.PROCEDURE);
                    pushEdge(proc, ppname, CallType.PERFORM);
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
                    debug(message.stargin_cics);
                    
                    let infinitLoopcontrol = 0;
                    // Iter the EXEC block line by line
                    while (true) {
                        if (++infinitLoopcontrol > PROCEDURE_MAX_LINE) throw messages.max_line_per_procedure; 
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
        if (++lineno >= code.length) throw messages.syntax_error;
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
        'size="14,10"; ratio = fill;',
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
        debug(n.id, n);
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
