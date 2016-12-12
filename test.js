QUnit.module("Parse");
QUnit.test("Regex", function( assert ) {
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