---
title: "Lucia 1.0"
description: "Announcing Lucia 1.0!"
date: "April 9th, 2023"
video: "https://www.youtube.com/watch?v=j8lyUqKdmJQ"
---

We are thrilled to announce Lucia v1.0!

Lucia is a server-side authentication library for TypeScript that aims to be unintrusive, straightforward, and flexible.

At its core, it's a library for managing users and sessions, providing the building blocks for setting up auth just how you want. Database adapters allow Lucia to be used with any modern ORMs/databases and integration packages make it easy to implement things like OAuth.

Here's what working with Lucia looks like:

```ts
const user = await auth.createUser({
	// how to identify user for authentication?
	primaryKey: {
		providerId: "email", // using email
		providerUserId: "user@example.com", // email to use
		password: "123456"
	},
	// custom attributes
	attributes: {
		email: "user@example.com"
	}
});
const session = await auth.createSession(user.userId);
const sessionCookie = auth.createSessionCookie(session);
```

It started off as a small JWT-based library for SvelteKit made over summer break. Over the last few months, we switched to sessions, made it framework agnostic, added keys and OAuth support, and cleaned up the APIs. Even with all the breaking changes, it's still a huge passion project that aims to provide a solution between something fully custom and ready-made.

Our core approach remained the same as well. Simple is better than easy. Things should be obvious and easy to understand. APIs should be applicable to a wide range of scenarios, even when a bit verbose. Being easy is nice at the start, but unfortunately leads to endless configuration and callbacks. We also believe documentation and learning resources are crucial to a library's success and have spent countless hours on it.

As of writing, the project has over 750 stars and nearly 3,000 weekly downloads. Special thanks to:

- [SkepticMystic](https://github.com/SkepticMystic)
- [Tazor](https://github.com/TazorDE)
- [CokaKoala](https://github.com/AdrianGonz97)
- [Faey](https://github.com/FaeyUmbrea)
- [Huntabyte](https://github.com/huntabyte)
- [dawidmachon](https://github.com/dawidmachon)

and, of course, a big thanks to everyone who has contributed! [Valentin Rogg](https://github.com/v-rogg), [Blastose](https://github.com/Blastose), [Ingo Krumbein](https://github.com/Jings), [Felipe dos Santos](https://github.com/ffss92), [Dana Woodman](https://github.com/danawoodman), [Alexander Way](https://github.com/alex-way), [captaindirgo](https://github.com/captaindirgo), [Christopher Pfohl](https://github.com/Crisfole), [Jean-Cédric Huet](https://github.com/BiscuiTech), [Johan Karlsson](https://github.com/JouanDeag), [Oscar Beaumont](https://github.com/oscartbeaumont), [Parables Boltnoel](https://github.com/Parables), [CA Gustavo](https://github.com/gustavocadev), [Zach](https://github.com/zach-hopkins), [Boian Ivanov](https://github.com/boian-ivanov), [Fabian Merino](https://github.com/fabianmerino), [Jasper Kelder](https://github.com/JasperKelder), [Jeremy Schoonover](https://github.com/skoontastic), [Jordan Calhoun](https://github.com/jordancalhoun), [Kelby Faessler](https://github.com/kelbyfaessler), [Lih Haur Voon](https://github.com/leovoon), [Marvin](https://github.com/m4rvr), [Mathis Côté](https://github.com/BenocxX), [Oskar](https://github.com/oskar-gmerek), [Roga](https://github.com/rogadev),[Thomas Slater](https://github.com/taslater), [VoiceOfSoftware](https://github.com/VoiceOfSoftware), [hffeka](https://github.com/hffeka), [moka-ayumu](https://github.com/moka-ayumu), [weepy](https://github.com/weepy)

**Ready to update? Read the [migration guide!](https://lucia-auth.com/start-here/migrate-to-version-1)**
