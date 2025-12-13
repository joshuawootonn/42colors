"use client";

import { z } from "zod";

import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { Link } from "@/components/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import authService, { AuthError } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearErrors();

    try {
      await authService.forgotPassword(data);
      router.back();
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof ForgotPasswordFormData, {
            type: "server",
            message: messages[0],
          });
        });
      } else {
        setError("root", {
          type: "server",
          message: error instanceof Error ? error.message : "Failed to send reset email",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && <div className="mb-4 text-sm text-red-600">{errors.root.message}</div>}

      <div className="flex flex-col space-y-1">
        <label htmlFor="email">Email address</label>
        <Input
          id="email"
          type="email"
          allowPasswordManager={true}
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <Button className="flex-grow" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset email"}
        </Button>
        <Link href="/login">Remember it after all?</Link>
      </div>
    </form>
  );
}
