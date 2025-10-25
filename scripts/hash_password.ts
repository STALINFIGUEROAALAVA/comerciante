import { hashPassword } from "../utils/auth.ts";

const password = Deno.args[0];

if (!password) {
  console.error("Usage: deno task hash <password>");
  Deno.exit(1);
}

const hash = await hashPassword(password);
console.log("Password hash:");
console.log(hash);
