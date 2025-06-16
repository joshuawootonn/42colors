"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import authService, { RegisterCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Signup() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.register(credentials);
      router.back();
    } catch (_) {
      setError(
        "Registration failed. Please check your information and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}

      <div className="flex flex-col space-y-1 ">
        <label htmlFor="email">Email address</label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={credentials.email}
          onChange={(e) =>
            setCredentials({ ...credentials, email: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col space-y-1 ">
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={credentials.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
        />
      </div>

      <div className="flex flex-col space-y-1 ">
        <label htmlFor="password_confirmation">Confirm Password</label>
        <Input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          required
          value={credentials.password_confirmation}
          onChange={(e) =>
            setCredentials({
              ...credentials,
              password_confirmation: e.target.value,
            })
          }
        />
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <Button type="submit" className="flex-grow" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </form>
  );
}
