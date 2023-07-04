export type UserDoc = {
	_id: string;
	__v?: any;
	_doc?: any;
	$__?: any;
	username: string;
};

export type SessionDoc = {
	_id: string;
	__v?: any;
	active_expires: number;
	user_id: string;
	idle_expires: number;
};

export type KeyDoc = {
	_id: string;
	__v?: any;
	user_id: string;
	hashed_password?: string | null;
	primary_key: boolean;
	expires?: number | null;
};
