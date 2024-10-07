export type TimeSpanUnit = "ms" | "s" | "m" | "h" | "d" | "w";

export class TimeSpan {
	constructor(value: number, unit: TimeSpanUnit) {
		this.value = value;
		this.unit = unit;
	}

	public value: number;
	public unit: TimeSpanUnit;

	public milliseconds(): number {
		if (this.unit === "ms") {
			return this.value;
		}
		if (this.unit === "s") {
			return this.value * 1000;
		}
		if (this.unit === "m") {
			return this.value * 1000 * 60;
		}
		if (this.unit === "h") {
			return this.value * 1000 * 60 * 60;
		}
		if (this.unit === "d") {
			return this.value * 1000 * 60 * 60 * 24;
		}
		return this.value * 1000 * 60 * 60 * 24 * 7;
	}

	public seconds(): number {
		return this.milliseconds() / 1000;
	}

	public transform(x: number): TimeSpan {
		return new TimeSpan(Math.round(this.milliseconds() * x), "ms");
	}
}

export function isWithinExpirationDate(date: Date): boolean {
	return Date.now() < date.getTime();
}

export function createDate(timeSpan: TimeSpan): Date {
	return new Date(Date.now() + timeSpan.milliseconds());
}
