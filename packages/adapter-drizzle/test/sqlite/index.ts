import { testLibSql } from "./libsql";
import { testBsqlite3 } from "./bsqlite3";

await testLibSql();

await testBsqlite3();
