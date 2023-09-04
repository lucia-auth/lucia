export const getPKCS8Key = (pkcs8: string) => {
	return [
		"\n",
		pkcs8
			.replace(/-----BEGIN PRIVATE KEY-----/, "")
			.replace(/-----END PRIVATE KEY-----/, ""),
		"\n"
	].join("");
};
