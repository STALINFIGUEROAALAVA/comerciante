import { type PageProps } from "$fresh/server.ts";
import Layout from "../components/Layout.tsx";

interface State {
  session?: {
    userId: number;
    username: string;
    role: string;
  };
}

export default function App({ Component, state }: PageProps<unknown, State>) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Billing System</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Layout session={state.session}>
          <Component />
        </Layout>
      </body>
    </html>
  );
}
