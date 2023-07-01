import sqlite from "better-sqlite3";
import fs from "fs";

const db = sqlite("main.db");
const migration = fs.readFileSync("migration.sql", "utf8");
db.exec(migration);
