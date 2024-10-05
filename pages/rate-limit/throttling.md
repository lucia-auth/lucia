---
title: "Throttling"
---

# Throttling

After each failed attempt, the user has to wait longer before their next attempt.

## Memory storage

```ts
export class Throttler<_Key> {
	public timeoutSeconds: number[];

	private storage = new Map<_Key, ThrottlingCounter>();

	constructor(timeoutSeconds: number[]) {
		this.timeoutSeconds = timeoutSeconds;
	}

	public consume(key: _Key): boolean {
		let counter = this.storage.get(key) ?? null;
		const now = Date.now();
		if (counter === null) {
			counter = {
				timeout: 0,
				updatedAt: now
			};
			this.storage.set(key, counter);
			return true;
		}
		const allowed = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;
		if (!allowed) {
			return false;
		}
		counter.updatedAt = now;
		counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
		this.storage.set(key, counter);
		return true;
	}

	public reset(key: _Key): void {
		this.storage.delete(key);
	}
}
```

Here, on each failed sign in attempt, the lockout gets extended with a max of 5 minutes.

```ts
const throttler = new Throttler([0, 1, 2, 4, 8, 16, 30, 60, 180, 300]);

if (!throttler.consume(userId)) {
	throw new Error("Too many requests");
}
if (!verifyPassword(password)) {
	throw new Error("Invalid password");
}
throttler.reset(user.id);
```
