import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const APP_USERNAME = process.env.AUTH_USERNAME ?? "";
const APP_PASSWORD = process.env.AUTH_PASSWORD ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!APP_USERNAME || !APP_PASSWORD) {
          throw new Error("Server is missing AUTH_USERNAME or AUTH_PASSWORD env vars.");
        }
        if (username === APP_USERNAME && password === APP_PASSWORD) {
          return { id: "user-1", name: APP_USERNAME };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    authorized: async ({ auth }) => Boolean(auth),
  },
});
