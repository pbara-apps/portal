import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorToast, successToast } from "@/components/shared/toast-notification";
import { useChangePassword } from "../api/auth";
import { useChapterSession } from "../store/useChapterSession";

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

/**
 * Change password. Required on first sign-in (one-time password), and
 * available any time from the sidebar.
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const isFirstLogin = useChapterSession((s) => !s.profile?.hasChangedPassword);
  const changePassword = useChangePassword();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordValues>({
    mode: "onTouched",
  });

  const onSubmit = async ({ currentPassword, newPassword }: PasswordValues) => {
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      successToast("Your password has been changed.", "Password updated");
      reset();
      if (isFirstLogin) navigate("/chapter", { replace: true });
    } catch (err) {
      errorToast((err as { message?: string })?.message ?? "Unable to change password.", "Error");
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-text-dark/5 bg-surface p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-primary">
          {isFirstLogin ? "Choose your password" : "Change password"}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {isFirstLogin
            ? "You signed in with a one-time password. Choose your own password to start using the portal."
            : "Use at least 8 characters, with at least one letter and one number."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          <Input
            {...register("currentPassword", { required: "Enter your current password" })}
            type="password"
            label={isFirstLogin ? "One-time password" : "Current password"}
            autoComplete="current-password"
            error={errors.currentPassword?.message}
          />
          <Input
            {...register("newPassword", {
              required: "Enter a new password",
              minLength: { value: 8, message: "Use at least 8 characters" },
              validate: (v) =>
                (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number",
            })}
            type="password"
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
          />
          <Input
            {...register("confirmPassword", {
              required: "Confirm your new password",
              validate: (v) => v === watch("newPassword") || "Passwords don't match",
            })}
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={changePassword.isPending} className="bg-primary text-white">
            Save password
          </Button>
        </form>
      </div>
    </div>
  );
}
