import type { LinksFunction, V2_MetaFunction } from "@remix-run/node";

import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration
} from "@remix-run/react";

import styles from "./root.css";

export const links: LinksFunction = () => [
	{
		rel: "stylesheet",
		href: styles
	}
];

export const meta: V2_MetaFunction = () => [{ title: "Lucia + Remix demo" }];

export default function App() {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<h1>
					<a href="/">Lucia + Remix demo</a>
				</h1>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
