# `@lucia-auth/adapter-fauna`

**Disclaimer: This adapter is outdated and does NOT work with 0.5.x!!**

[Fauna](https://fauna.com) adapter for Lucia

**[Documentation](https://lucia-auth.vercel.app/learn/adapters/fauna)**

**[Lucia documentation](https://lucia-auth.vercel.app)**

**[Changelog](https://github.com/pilcrowOnPaper/lucia-auth/blob/main/packages/adapter-fauna/CHANGELOG.md)**

## Installation

```
npm install @lucia-auth/adapter-fauna
```

## Lucia version compatibility

| Fauna adapter version | Lucia version |
| --------------------- | ------------- |
| 0.1.x                 | 0.1.x ~ 0.3.x |
| 0.2.x                 | 0.4.x         |

## Testing

Add `FAUNA_SECRET` and `FAUNA_ENDPOINT` ([endpoint docs](https://docs.fauna.com/fauna/current/learn/understanding/region_groups#region-group-endpoints)) to `.env`.
Optionally add `FAUNA_USER_TABLE` and `FAUNA_SESSION_TABLE` to satisfy to `AdapterConfig`.

```
npm run test
```
