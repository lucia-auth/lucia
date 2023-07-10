import "./globals.css";

export const metadata = {
	title: "Email and password auth with Lucia"
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
