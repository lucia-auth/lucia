export function convertUserResponse(res: any) {
	const array: any[] = [];
	res.forEach((row: { data: { [x: string]: any; id: any; hashed_password: any; provider_id: any } }) => {
		const { id, hashed_password, provider_id, ...attributes } = row.data;
		array.push({
			id, provider_id, hashed_password: hashed_password === undefined ? null : hashed_password, ...attributes
		});
	});
	return array;
}

export function convertSessionResponse(res: any) {
	const array: any[] = [];
	res.forEach((row: { data: { id: any; user_id: any; expires: any; idle_expires: any; }; }) => {
		const { id, user_id, expires, idle_expires } = row.data;
		array.push({
			id, user_id, expires, idle_expires
		});
	});
	return array;
}
