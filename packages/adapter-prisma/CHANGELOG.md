# @lucia-auth/adapter-prisma

## 4.0.1

-   Update dependencies.

## 4.0.0

See the [migration guide](https://v3.lucia-auth.com/upgrade-v3/prisma).

## 3.0.2

### Patch changes

-   [#1166](https://github.com/lucia-auth/lucia/pull/1166) by [@timnghg](https://github.com/timnghg) : Fix type `Adapter.updateKey()`, rename param `userId` to `keyId`

## 3.0.1

### Patch changes

-   [#929](https://github.com/pilcrowOnPaper/lucia/pull/929) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix delete operations throwing if the target does not exist

## 3.0.0

### Major changes

-   [#885](https://github.com/pilcrowOnPaper/lucia/pull/885) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update version and peer dependency

## 3.0.0-beta.8

### Major changes

-   [#858](https://github.com/pilcrowOnPaper/lucia/pull/858) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `prisma()` params

### Minor changes

-   [#867](https://github.com/pilcrowOnPaper/lucia/pull/867) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.7

### Minor changes

-   [#842](https://github.com/pilcrowOnPaper/lucia/pull/842) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.6

### Patch changes

-   [#823](https://github.com/pilcrowOnPaper/lucia/pull/823) by [@delight](https://github.com/delight) : Adjust peerDependency to solve the unmet peer dependency warning for prisma 5.x

## 3.0.0-beta.5

### Minor changes

-   [#815](https://github.com/pilcrowOnPaper/lucia/pull/815) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Make `session` model name params optional

-   [#812](https://github.com/pilcrowOnPaper/lucia/pull/812) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.4

### Patch changes

-   [#803](https://github.com/pilcrowOnPaper/lucia/pull/803) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.3

### Major changes

-   [#788](https://github.com/pilcrowOnPaper/lucia/pull/790) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@2.0.0-beta.3`

## 3.0.0-beta.2

### Patch changes

-   [#768](https://github.com/pilcrowOnPaper/lucia/pull/768) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.1

### Major changes

-   [#755](https://github.com/pilcrowOnPaper/lucia/pull/755) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update `prisma()` parameters

### Patch changes

-   [#756](https://github.com/pilcrowOnPaper/lucia/pull/756) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix peer dependency version

## 3.0.0-beta.0

### Major changes

-   [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@^2.0.0`

    -   Export adapter as named exports (`prisma()`)

    -   Update adapter params

## 2.0.0

### Major changes

-   [#529](https://github.com/pilcrowOnPaper/lucia/pull/529) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Requires `lucia-auth@^1.3.0`

    -   Update to new specifications

## 1.0.0

### Major changes

-   [#443](https://github.com/pilcrowOnPaper/lucia/pull/443) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Release version 1.0!

## 0.7.1

### Patch changes

-   [#452](https://github.com/pilcrowOnPaper/lucia/pull/452) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix issue where all errors from `setUser()` were thrown as `INVALID_KEY_ID` Lucia error

## 0.7.0

### Minor changes

-   [#430](https://github.com/pilcrowOnPaper/lucia/pull/430) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Require `lucia-auth` 0.11.0

    -   Update schema

## 0.6.1

### Patch changes

-   [#424](https://github.com/pilcrowOnPaper/lucia/pull/424) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : - Update dependencies

## 0.6.0

### Minor changes

-   [#398](https://github.com/pilcrowOnPaper/lucia/pull/398) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia-auth@0.9.0`

## 0.5.3

### Patch changes

-   [#392](https://github.com/pilcrowOnPaper/lucia/pull/392) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 0.5.2

### Patch changes

-   [#388](https://github.com/pilcrowOnPaper/lucia/pull/388) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : remove unnecessary code

## 0.5.1

### Patch changes

-   [#381](https://github.com/pilcrowOnPaper/lucia/pull/381) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update links in README and package.json

## 0.5.0

-   [Breaking] Require minimum `lucia-auth` 0.7.0

## 0.4.0

-   [Breaking] Require minimum `lucia-auth` 0.6.0

## 0.3.0

-   [Breaking] Require minimum `lucia-auth` 0.5.0

## 0.2.2

-   [Fix] Remove minor breaking change introduced in `0.2.1`

## 0.2.1

-   Remove `prisma` and `@prisma/client` dependencies

## 0.2.0

-   [Breaking] Require minimum `lucia-auth` 0.4.0

-   [Breaking] Remove global error handler

## 0.1.4

-   Update peer dependency

## 0.1.3

-   Update peer dependency

## 0.1.2

-   Update peer dependency
