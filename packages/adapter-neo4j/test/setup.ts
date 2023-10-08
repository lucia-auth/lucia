import { driver, session } from "./db";

(async () => {
	console.log("Executing setup...");

	const verify = await driver.verifyAuthentication();
	console.log("Verifying authentication...");
	console.log(`Authentication verified: ${verify}`);
	try {
		await session.executeWrite(async (tx) => {
			await tx.run(
				`CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE`
			);
			await tx.run(
				`CREATE CONSTRAINT IF NOT EXISTS FOR (uk:UserKey) REQUIRE uk.id IS UNIQUE`
			);
			await tx.run(
				`CREATE CONSTRAINT IF NOT EXISTS FOR (us:UserSession) REQUIRE us.id IS UNIQUE`
			);
		});

		await session.executeWrite(async (tx) => {
			console.log("Merging nodes and relationships...");
			await tx.run(
				`
      MERGE (user1:User {id: 'user1'})
      MERGE (user2:User {id: 'user2'})
      MERGE (key1:UserKey {id: 'key1', hashed_password: 'hash1'})
      MERGE (key2:UserKey {id: 'key2', hashed_password: 'hash2'})
      MERGE (session1:UserSession {id: 'session1', active_expires: 123456, idle_expires: 789012})
      MERGE (session2:UserSession {id: 'session2', active_expires: 987654, idle_expires: 543210})
      MERGE (user1)<-[:BELONGS_TO]-(key1)
      MERGE (user2)<-[:BELONGS_TO]-(key2)
      MERGE (user1)<-[:BELONGS_TO]-(session1)
      MERGE (user2)<-[:BELONGS_TO]-(session2)
      `
			);
		});
	} catch (err) {
		console.log("Error occurred during setup:");
		console.error(err);
		process.exit(1);
	} finally {
		console.log("Closing session...");
		session.close();
		process.exit(0);
	}
})();
