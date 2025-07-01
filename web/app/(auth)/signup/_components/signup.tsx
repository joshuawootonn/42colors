"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import authService, { RegistrationError } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
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

type SignupFormData = z.infer<typeof signupSchema>;

export function Signup() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    clearErrors();

    try {
      await authService.register(data);
      router.back();
    } catch (error: unknown) {
      // Handle backend validation errors
      if (error instanceof RegistrationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof SignupFormData, {
            type: "server",
            message: messages[0],
          });
        });
      } else {
        setError("root", {
          type: "server",
          message:
            error instanceof Error
              ? error.message
              : "Registration failed. Please try again.",
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
        <label htmlFor="email">Email address</label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <span className="text-red-600 text-sm">{errors.email.message}</span>
        )}
      </div>

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
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
