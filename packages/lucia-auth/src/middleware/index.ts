import type { IncomingMessage } from "node:http";
import type { Middleware } from "../index.js";
import type { Request as ExpressRequest } from "express";

export const web = (): Middleware<Request> => {
	return {
		transformRequest: (request) => {
			return {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.get("Origin") ?? null,
					cookie: request.headers.get("Cookie") ?? null
				}
			};
		}
	};
};

export const node = (): Middleware<IncomingMessage> => {
	return {
		transformRequest: (request) => {
			return {
				url: request.url ?? "",
				method: request.method ?? "",
				headers: {
					origin: request.headers.origin ?? null,
					cookie: request.headers.cookie ?? null
				}
			};
		}
	};
};

export const express = (): Middleware<ExpressRequest> => {
	return {
		transformRequest: (request) => {
			return {
				url: request.url,
				method: request.method,
				headers: {
					origin: request.headers.origin ?? null,
					cookie: request.headers.cookie ?? null
				}
			};
		}
	};
};
