import { testPgPackage } from "./pg";
import { testPostgresPackage } from "./postgres";

await testPgPackage();

// 'postgres' package fails tests because there's no way to see how many rows were effected by a sql call
// if you uncomment this, make sure that you make the testAdapter call in testPgPackage() not exit

// await testPostgresPackage()
