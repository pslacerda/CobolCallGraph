
var program_1 = 
    "       IDENTIFICATION                  DIVISION.\n" +
    "       PROGRAM-ID. XYZ647.\n" +
    "       AUTHOR.     NoBody.\n" +
    "       ENVIRONMENT DIVISION.\n" +
    "\n" +
    "       CONFIGURATION                   SECTION.\n" +
    "       SPECIAL-NAMES.                  DECIMAL-POINT IS COMMA.\n" +
    "       DATA DIVISION.\n" +
    "       WORKING-STORAGE                 SECTION.\n" +
    "       0000-PRINCIPAL                  SECTION.\n" +
    "           PERFORM 1000-START\n" +
    "           PERFORM 2000-PROCESS\n" +
    "           PERFORM 2000-PROCESS\n" +
    "           PERFORM 4000-FINISH\n" +
    "       0000-99-FIM.                    EXIT.\n" +
    "\n" +
    "       1000-START                SECTION.\n" +
    "       1000-99-FIM.                    EXIT.\n" +
    "\n" +
    "\n" +
    "       2000-PROCESS                  SECTION.\n" +
    "           PERFORM 2200-TRATA-PAGINACAO-INICIAL\n" +
    "           PERFORM 9999-API-ERROS\n"               +
    "       2000-99-FIM.                    EXIT.\n" +
    "       *   ========================================================\n" +
    "       4000-FINISH                  SECTION.           \n" +
    "\n" +
    "       4000-99-FIM.                    EXIT.\n" +
    "       *   ========================================================\n" +
    "\n" +
    "       2200-TRATA-PAGINACAO-INICIAL    SECTION.\n" +
    "\n" +
    "       2200-99-FIM.                    EXIT.\n" +
    "\n" +
    "       9999-API-ERROS                  SECTION.\n" +
    "           EXEC CICS LINK\n" +
    "               PROGRAM  (WRK-XYZ1999)\n" +
    "               COMMAREA (WRK-AREA-ERRO)\n" +
    "               LENGTH   (LENGTH        OF WRK-AREA-ERRO)\n" +
    "               NOHANDLE\n" +
    "           END-EXEC\n" +
    "           PERFORM 4000-FINISH.\n" +
    "       9999-99-FIM.                    EXIT.\n";
