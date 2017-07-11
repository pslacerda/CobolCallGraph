QUnit.module("Regex");
QUnit.test("User definitions", function( assert ) {
  assert.ok( PROCEDURE_DIVISION_BEGIN_RE.test("       PROCEDURE DIVISION              USING DFHCOMMAREA."), "Procedure Division." );
  assert.ok( PROGRAM_ID_RE              .test("       PROGRAM-ID. XYZ445."                               ), "Program id." );
  assert.ok( PROC_BEGIN_RE              .test("       1111-START           SECTION."                     ), "Begin Proc" );
  assert.ok( PROC_EXIT_RE               .test("       1111-99-FIM.                    EXIT."             ), "Exit Proc" );
  assert.ok( PERFORM_RE                 .test("               PERFORM 1111-START"                        ), "Perform." );  
});

QUnit.test("Default Sections", function( assert ) {
    assert.ok( DEFAULT_SECTIONS.test("       CONFIGURATION                   SECTION."), "Configuration." );
    assert.ok( DEFAULT_SECTIONS.test("       LINKAGE                         SECTION."), "Linkage." );
});


QUnit.module("Parser");
QUnit.test("Parse source", function( assert ) {
    var source = program_1; 
    var graph = parseCallGraph(source, false, true, {});
    for(var i in graph.nodes) {
        debug(graph.nodes[i]);
    }
    assert.ok(graph, "Graph is not null");
    assert.ok(graph.nodes, "Nodes is not null");
    assert.ok(graph.edges, "Edges is not null");
    assert.equal(graph.nodes.length, 7, "Finded 7 procedures");
    assert.equal(graph.edges.length, 6, "Finded 6 links to procedures");
});
