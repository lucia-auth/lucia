import { testAdapter, databaseUser } from "@lucia-auth/adapter-test";
import { DenoKvAdapter } from "../src/index";
import { openKv, KvKeyPart } from "@deno/kv";

const kvDb = await openKv(); // without params it uses in memory db

const usersKey: KvKeyPart[] = ["users"];
const sessionsKey: KvKeyPart[] = ["sessions"];

const adapter = new DenoKvAdapter(kvDb, usersKey, sessionsKey);

await kvDb.set([...usersKey, databaseUser.id], databaseUser);

await testAdapter(adapter);

kvDb.close(); // closing the db will delete the records created since it's an in memory db

process.exit();
