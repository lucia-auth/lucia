export type AwaitedReturnType<T extends (...args: any[]) => any> = Awaited<
	ReturnType<T>
>;
