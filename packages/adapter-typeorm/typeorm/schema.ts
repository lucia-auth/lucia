// This is your TypeORM entity file,
// learn more about it in the docs: https://typeorm.io/entities
import "reflect-metadata";
import {
  Entity,
  Column,
  Index,
  PrimaryColumn
} from "typeorm";
import { instanceToPlain } from "class-transformer";

class BaseEntity {
  toJSON(): {} {
    return instanceToPlain(this);
  }
}

@Entity({ name: "user" })
export class User extends BaseEntity {
  @PrimaryColumn({ name: "id", type: "text" })
  id: string;

  @Column({ name: "username", type: "varchar", length: "256", unique: true })
  username: string;
}

@Entity({ name: "session" })
export class Session extends BaseEntity {
  @PrimaryColumn({ name: "id", type: "text" })
  id: string;

  @Column({ name: "user_id", type: "text" })
  @Index()
  user_id: string;

  @Column({ name: "active_expires", type: "bigint" })
  active_expires: number;

  @Column({ name: "idle_expires", type: "bigint" })
  idle_expires: number;

  @Column({ name: "country", type: "varchar", length: "256" })
  country: string;
}

@Entity({ name: "key" })
export class Key extends BaseEntity {
  @PrimaryColumn({ name: "id", type: "text" })
  id: string;

  @Column({ name: "user_id", type: "text" })
  @Index()
  user_id: string;

  @Column({ name: "hashed_password", type: "text", nullable: true })
  hashed_password: string | null;
}
