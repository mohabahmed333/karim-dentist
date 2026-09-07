import { LoginForm } from "@/features/admin/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center bg-background p-6">
      <LoginForm />
    </div>
  );
}
