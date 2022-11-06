import "../styles/globals.css";
import "../styles/base.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<h1>Lucia + Next.js demo</h1>
			<Component {...pageProps} />
		</>
	);
}
