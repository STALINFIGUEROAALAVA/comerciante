import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionFromRequest } from "./utils/session.ts";

interface State {
  session?: {
    userId: number;
    username: string;
    role: string;
  };
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const session = getSessionFromRequest(req);
  
  if (session) {
    ctx.state.session = session;
  }

  // Allow public routes
  const url = new URL(req.url);
  const publicRoutes = ["/login", "/api/auth/login", "/_frsh/"];
  const isPublic = publicRoutes.some(route => url.pathname.startsWith(route));
  
  if (!session && !isPublic && !url.pathname.startsWith("/static")) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  return await ctx.next();
}
