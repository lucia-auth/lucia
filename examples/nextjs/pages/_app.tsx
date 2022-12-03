import "../styles/globals.css";
import "../styles/base.css";
import type { AppProps } from "next/app";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<h1><Link href="/">Lucia + Next.js demo</Link></h1>
			<Component {...pageProps} />
		</>
	);
}
