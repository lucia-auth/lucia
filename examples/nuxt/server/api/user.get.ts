export default defineEventHandler(async (event) => {
    const authRequest = auth.handleRequest(event);
    const { user } = await authRequest.validateUser();
    return { user };
});
