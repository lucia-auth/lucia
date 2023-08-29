// This is your TypeORM entity file,
// learn more about it in the docs: https://typeorm.io/entities
import "reflect-metadata";
import {
	Entity,
	Column,
	OneToMany,
	JoinColumn,
	ManyToOne,
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

	@OneToMany(() => Session, (session) => session.user)
	@JoinColumn({ referencedColumnName: "id" })
	authSessions?: Session[];

	@OneToMany(() => Key, (key) => key.user)
	@JoinColumn({ referencedColumnName: "id" })
	authKeys?: Key[];
}

@Entity({ name: "session" })
export class Session extends BaseEntity {
	@PrimaryColumn({ name: "id", type: "text" })
	id: string;

	@Column({ name: "user_id", type: "text" })
	@Index()
	userId: string;

	@Column({ name: "active_expires", type: "bigint" })
	activeExpires: number;

	@Column({ name: "idle_expires", type: "bigint" })
	idleExpires: number;

	@Column({ name: "country", type: "varchar", length: "256" })
	country: string;

	@ManyToOne(() => User, (user) => user.authSessions)
	@JoinColumn({ name: "user_id", referencedColumnName: "id" })
	user: User;
}

@Entity({ name: "key" })
export class Key extends BaseEntity {
	@PrimaryColumn({ name: "id", type: "text" })
	id: string;

	@Column({ name: "user_id", type: "text" })
	@Index()
	userId: string;

	@Column({ name: "hashed_password", type: "text", nullable: true })
	hashedPassword: string | null;

	@ManyToOne(() => User, (user) => user.authKeys)
	@JoinColumn({ name: "user_id", referencedColumnName: "id" })
	user: User;
}
