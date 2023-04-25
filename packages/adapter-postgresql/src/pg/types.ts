import pg from "pg";

export type Pool = InstanceType<typeof pg.Pool>;
export type DatabaseError = InstanceType<typeof pg.DatabaseError>;
