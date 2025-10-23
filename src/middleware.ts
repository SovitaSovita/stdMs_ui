import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);
// export { default } from "next-auth/middleware"


export const config = {
  matcher: [
    "/",
    "/classrooms:path*",
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)"
  ],
};
