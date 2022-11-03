import { handleApiRoutes } from "@lucia-auth/nextjs";
import { auth } from "../../lib/lucia";

export default handleApiRoutes(auth);
