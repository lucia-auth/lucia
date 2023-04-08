# Cela

This is a content "management" utility for Lucia's documentation. It automatically generates content and its path from markdown, and makes it easy to serve content as well as a list of content.

- `[collection]/[sub-collection]/[doc].md` => `/[collection]/[sub-collection]/[doc]`
- `[collection]/[sub-collection].[framework]/[doc].md` => `/[collection]/[sub-collection]/[doc]` with `[framework]` option
- `[collection]/[sub-collection]/[doc].[framework].md` => `/[collection]/[sub-collection]/[doc]` with `[framework]` option
