"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import authService, { ForgotPasswordCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/link";

export function ForgotPassword() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<ForgotPasswordCredentials>({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(credentials);
      router.back();
    } catch (_) {
      setError("Invalid email or password");
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

      <div className="flex items-center space-x-4 pt-4">
        <Button className="flex-grow" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </Button>
        <Link href="/login">Remember it after all?</Link>
      </div>
    </form>
  );
}
