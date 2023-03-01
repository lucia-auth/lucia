# Collection API

This is a custom API for fetching stored markdown files similar to Astro's own Collection API. Meta data for directories can be stored in addition to those for markdown files. It uses a super basic validation API to validate schemas.

Any methods starting with `$` (e.g. `$getAllNestedDocuments`) can only be used in a server context.