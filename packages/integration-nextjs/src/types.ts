export type NextRequest = {
	headers: Record<any, string | string[] | undefined>;
	url?: string;
	method?: string;
};

export type NextResponse = {
	getHeader: (name: string) => string | number | string[] | undefined;
	setHeader: (name: string, value: string | number | readonly string[]) => any;
	status?: (status: number) => {
		json: (data: Record<any, any>) => any;
		send: (data: any) => any;
	};
};

export type NextContext = {
	req: NextRequest;
	res: NextResponse;
};
