// Create uniqueness constraints
CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (uk:UserKey) REQUIRE uk.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (us:S) REQUIRE us.id IS UNIQUE;

// Merge nodes and relationships
MERGE (user1:User {id: 'user1'})
MERGE (user2:User {id: 'user2'})
MERGE (key1:UserKey {id: 'key1', hashed_password: 'hash1'})
MERGE (key2:UserKey {id: 'key2', hashed_password: 'hash2'})
MERGE (session1:UserSession {id: 'session1', active_expires: 123456, idle_expires: 789012})
MERGE (session2:UserSession {id: 'session2', active_expires: 987654, idle_expires: 543210})
MERGE (user1)<-[:BELONGS_TO]-(key1)
MERGE (user2)<-[:BELONGS_TO]-(key2)
MERGE (user1)<-[:BELONGS_TO]-(session1)
MERGE (user2)<-[:BELONGS_TO]-(session2);
