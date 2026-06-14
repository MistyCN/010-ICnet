import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/discussions");
  }

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-12 bg-background">
      <LoginForm />
    </div>
  );
}
