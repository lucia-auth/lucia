import sqlite from "better-sqlite3";
import fs from "fs";

const db = sqlite("main.db");
const migration = fs.readFileSync("migration/schema.sql", "utf8");
db.exec(migration);
