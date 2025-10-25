import { Handlers } from "$fresh/server.ts";
import { getSessionFromRequest, deleteSession, clearSessionCookie } from "../../../utils/session.ts";

export const handler: Handlers = {
  POST(req) {
    const session = getSessionFromRequest(req);
    
    if (session) {
      const cookies = req.headers.get("cookie") || "";
      const sessionMatch = cookies.match(/session=([^;]+)/);
      if (sessionMatch) {
        deleteSession(sessionMatch[1]);
      }
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    clearSessionCookie(headers);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  },
};
