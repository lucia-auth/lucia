# @lucia-auth/adapter-mongoose

## 3.0.1

### Patch changes

- [#1248](https://github.com/lucia-auth/lucia/pull/1248) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependencies

## 3.0.0

### Major changes

- [#885](https://github.com/pilcrowOnPaper/lucia/pull/885) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update version and peer dependency

### Minor changes

- [#875](https://github.com/pilcrowOnPaper/lucia/pull/875) by [@SkepticMystic](https://github.com/SkepticMystic) : Add a `getSessionAndUserBySessionId` method to `mongoose()` adapter, using a lookup (join) instead of two separate db calls.

## 3.0.0-beta.7

### Minor changes

- [#867](https://github.com/pilcrowOnPaper/lucia/pull/867) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.6

### Minor changes

- [#842](https://github.com/pilcrowOnPaper/lucia/pull/842) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.5

### Minor changes

- [#815](https://github.com/pilcrowOnPaper/lucia/pull/815) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Make `Session` model params optional

- [#812](https://github.com/pilcrowOnPaper/lucia/pull/812) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.4

### Patch changes

- [#803](https://github.com/pilcrowOnPaper/lucia/pull/803) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.3

### Major changes

- [#788](https://github.com/pilcrowOnPaper/lucia/pull/790) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@2.0.0-beta.3`

## 3.0.0-beta.2

### Patch changes

- [#768](https://github.com/pilcrowOnPaper/lucia/pull/768) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 3.0.0-beta.1

### Patch changes

- [#756](https://github.com/pilcrowOnPaper/lucia/pull/756) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix peer dependency version

## 3.0.0-beta.0

### Major changes

- [#682](https://github.com/pilcrowOnPaper/lucia/pull/682) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia@^2.0.0`

  - Export adapter as named exports (`mongoose()`)

  - Update adapter params

## 2.0.0

### Major changes

- [#529](https://github.com/pilcrowOnPaper/lucia/pull/529) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Requires `lucia-auth@^1.3.0`

  - Update to new specifications

### Patch changes

- [#532](https://github.com/pilcrowOnPaper/lucia/pull/532) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Use projection to fetch data

- [#528](https://github.com/pilcrowOnPaper/lucia/pull/528) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Fix bugs

  - Fix `Adapter.deleteNonPrimaryKey()` deleting non-primary keys

  - Fix `Adapter.updateUserAttributes()` returning old data

## 1.0.0

### Major changes

- [#443](https://github.com/pilcrowOnPaper/lucia/pull/443) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Release version 1.0!

## 0.7.0

### Minor changes

- [#430](https://github.com/pilcrowOnPaper/lucia/pull/430) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : [Breaking] Require `lucia-auth` 0.11.0

  - Update schema

## 0.6.1

### Patch changes

- [#424](https://github.com/pilcrowOnPaper/lucia/pull/424) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : - Update dependencies

## 0.6.0

### Minor changes

- [#398](https://github.com/pilcrowOnPaper/lucia/pull/398) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Require `lucia-auth@0.9.0`

## 0.5.3

### Patch changes

- [#392](https://github.com/pilcrowOnPaper/lucia/pull/392) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update peer dependency

## 0.5.2

### Patch changes

- [#388](https://github.com/pilcrowOnPaper/lucia/pull/388) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : remove unnecessary code

## 0.5.1

### Patch changes

- [#381](https://github.com/pilcrowOnPaper/lucia/pull/381) by [@pilcrowOnPaper](https://github.com/pilcrowOnPaper) : Update links in README and package.json

## 0.5.0

- [Breaking] Require minimum `lucia-auth` 0.7.0

## 0.4.0

- [Breaking] Require minimum `lucia-auth` 0.6.0

## 0.3.0

- [Breaking] Require minimum `lucia-auth` 0.5.0

## 0.2.1

- [Fix] Fix error handling error

## 0.2.0

- [Breaking] Require minimum `lucia-auth` 0.4.0

- [Breaking] Remove global error handler

- Generates a new `ObjectId` and uses its 24-character hexadecimal representation as the user id if none is provided

## 0.1.5

- Update peer dependency

## 0.1.4

- [Fix] Remove `instance of` check for error [#213](https://github.com/pilcrowOnPaper/lucia/issues/213)

## 0.1.3

- Update dependencies

## 0.1.2

- Update peer dependency
