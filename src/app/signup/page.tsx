import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <AuthForm type="signup" />
    </div>
  );
}
