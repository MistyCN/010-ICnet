import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/register-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/discussions");
  }

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-12 bg-background">
      <RegisterForm />
    </div>
  );
}
