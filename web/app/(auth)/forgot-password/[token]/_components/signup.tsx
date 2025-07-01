"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authService, { AuthError } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(72, "Password must be less than 72 characters")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[!?@#$%^&*_]/, "Password must contain at least one special character"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export function UpdatePassword({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    clearErrors();

    try {
      await authService.updatePassword(token, data);
      location.assign(`/login?${searchParams.toString()}`);
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof UpdatePasswordFormData, {
            type: "server",
            message: messages[0],
          });
        });
      } else {
        setError("root", {
          type: "server",
          message: error instanceof Error ? error.message : "Failed to update password",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && (
        <div className="text-red-600 text-sm mb-4">{errors.root.message}</div>
      )}

      <div className="flex flex-col space-y-1">
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <span className="text-red-600 text-sm">
            {errors.password.message}
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="password_confirmation">Confirm Password</label>
        <Input
          id="password_confirmation"
          type="password"
          {...register("password_confirmation")}
          className={errors.password_confirmation ? "border-red-500" : ""}
        />
        {errors.password_confirmation && (
          <span className="text-red-600 text-sm">
            {errors.password_confirmation.message}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <Button type="submit" className="flex-grow" disabled={isSubmitting}>
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
