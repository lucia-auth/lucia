# `@lucia-auth/adapter-prisma`

[Prisma](https://www.prisma.io) adapter for Lucia

**[Documentation](https://lucia-auth.vercel.app/learn/adapters/prisma)**

**[Lucia documentation](https://lucia-auth.vercel.app)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia-auth/blob/main/packages/adapter-prisma/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-prisma
pnpm add @lucia-auth/adapter-prisma
yarn add @lucia-auth/adapter-prisma
```

## Lucia version compatibility

| prisma adapter version | Lucia version |
| ---------------------- | ------------- |
| 0.1.x                  | 0.1.x ~ 0.3.x |
| 0.2.x                  | 0.4.x         |
| 0.3.x                  | 0.5.x         |
| 0.4.x                  | 0.6.x         |
| 0.5.x                  | 0.7.x         |

## Testing

```
pnpm exec prisma migrate dev --name init
```

```
pnpm test
```
