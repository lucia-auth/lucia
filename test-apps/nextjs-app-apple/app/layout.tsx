import "./globals.css";

export const metadata = {
	title: "Lucia + Next.js App router"
};

const Layout = async ({ children }: { children: React.ReactNode }) => {
	return (
		<html lang="en">
			<body>
				<h1>
					<a href="/">Lucia + Next.js App router demo</a>
				</h1>
				{children}
			</body>
		</html>
	);
};

export default Layout;
