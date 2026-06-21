import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "./passwords";
import { validateMinecraftId, validatePassword } from "./validators";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Minecraft ID",
      credentials: {
        minecraftId: { label: "游戏 ID", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.minecraftId || !credentials?.password) {
          throw new Error("Minecraft ID 或密码错误");
        }

        const idVal = validateMinecraftId(credentials.minecraftId);
        const pwVal = validatePassword(credentials.password);
        if (!idVal.isValid || !pwVal.isValid) {
          throw new Error("Minecraft ID 或密码错误");
        }

        const { findUserByMinecraftIdCaseInsensitive } = await import("./data");
        const user = await findUserByMinecraftIdCaseInsensitive(credentials.minecraftId);

        if (!user) {
          throw new Error("Minecraft ID 或密码错误");
        }

        const isPasswordCorrect = await verifyPassword(credentials.password, user.passwordHash);
        if (!isPasswordCorrect) {
          throw new Error("Minecraft ID 或密码错误");
        }

        return {
          id: user.id,
          minecraftId: user.minecraftId,
          role: user.role,
          name: user.minecraftId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.minecraftId = user.minecraftId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.minecraftId = token.minecraftId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
