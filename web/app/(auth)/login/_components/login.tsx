"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import authService, { LoginCredentials } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/link";

export function Login() {
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
    remember_me: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.login(credentials);
      location.assign(`/?${searchParams.toString()}`);
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

      <div className="flex flex-col space-y-1">
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

      <div className="flex items-center space-x-4 pt-4">
        <Button className="flex-grow" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
        <Link
          href={{
            pathname: "/forgot-password",
            query: searchParams.toString(),
          }}
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
