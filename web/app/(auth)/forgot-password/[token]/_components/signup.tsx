"use client";

import { useState } from "react";
import authService, { UpdatePasswordCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export function UpdatePassword({ token }: { token: string }) {
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<UpdatePasswordCredentials>({
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.updatePassword(token, credentials);
      location.assign(`/login?${searchParams.toString()}`);
    } catch (_) {
      setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}

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
          {loading ? "Updating password..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
