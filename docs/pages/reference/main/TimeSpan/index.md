---
title: "TimeSpan"
---

# `TimeSpan`

Represents a time-span. Supports negative values.

## Constructor

```ts
//$ TimeSpanUnit=/reference/main/TimeSpanUnit
function constructor(value: number, unit: $$TimeSpanUnit): this;
```

### Parameters

-   `value`
-   `unit`: `ms` for milliseconds, `s` for seconds, etc

## Methods

-   [`milliseconds()`](/reference/main/TimeSpan/milliseconds)
-   [`seconds()`](/reference/main/TimeSpan/seconds)

## Properties

```ts
//$ TimeSpanUnit=/reference/main/TimeSpanUnit
interface Properties {
	unit: $$TimeSpanUnit;
	value: number;
}
```

-   `unit`
-   `value`

## Example

```ts
import { TimeSpan } from "oslo";

const halfSeconds = new TimeSpan(500, "ms");
const tenSeconds = new TimeSpan(10, "s");
const halfHour = new TimeSpan(30, "m");
const oneHour = new TimeSpan(1, "h");
const oneDay = new TimeSpan(1, "d");
const oneWeek = new TimeSpan(1, "w");
```
