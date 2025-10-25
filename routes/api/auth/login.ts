import { Handlers } from "$fresh/server.ts";
import { query } from "../../../db/client.ts";
import { verifyPassword } from "../../../utils/auth.ts";
import { createSession, setSessionCookie } from "../../../utils/session.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Username and password required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get user from database
      const result = await query(
        "SELECT * FROM users WHERE username = $1 AND active = true",
        [username]
      );

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const user = result.rows[0] as {
        id: number;
        username: string;
        password_hash: string;
        role: string;
      };

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create session
      const sessionId = createSession({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      // Set session cookie
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      setSessionCookie(headers, sessionId);

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
