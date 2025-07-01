import { z } from "zod";
import analytics from "./analytics";
import { store } from "./store";

const API_URL =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://api.42colors.com";

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface AuthUser {
  id: number;
  email: string;
}

export interface User {
  id: number;
  email: string;
  channel_token: string;
}

export interface AuthResponse {
  user: AuthUser;
  status: string;
}

export interface UserResponse {
  user: User;
  status: string;
}

export interface UpdatePasswordCredentials {
  password: string;
  password_confirmation: string;
}

export interface ConfirmEmailResponse {
  status: string;
  message: string;
  user?: {
    email: string;
  };
}

// Error response schemas
const errorResponseSchema = z.object({
  status: z.literal("error"),
  message: z.string(),
  errors: z.record(z.array(z.string())).optional(),
});

const successResponseSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  user: z.object({
    email: z.string(),
  }),
});

const registerResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

const loginResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

const forgotPasswordResponseSchema = z.union([
  z.object({
    status: z.literal("success"),
    message: z.string(),
  }),
  errorResponseSchema,
]);

const updatePasswordResponseSchema = z.union([
  successResponseSchema,
  errorResponseSchema,
]);

export class AuthError extends Error {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "AuthError";
    this.errors = errors ?? {};
  }
}

const authService = {
  async login(credentials: LoginCredentials): Promise<{ status: string; message: string; user: { email: string } }> {
    const response = await fetch(`${API_URL}/api/users/log_in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ user: credentials }),
    });

    const rawResult = await response.json();

    const parseResult = loginResponseSchema.safeParse(rawResult);

    if (!parseResult.success) {
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "error") {
      throw new AuthError(result.message, result.errors);
    }

    analytics.trackEvent("user_logged_in", {
      email: credentials.email,
      remember_me: credentials.remember_me,
    });

    store.trigger.fetchUser();

    return {
      user: result.user, 
      status: result.status,
      message: result.message,
    };
  },

  async register(
    credentials: RegisterCredentials,
  ): Promise<{ status: string; message: string; user: { email: string } }> {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ user: credentials }),
    });

    const rawResult = await response.json();

    // Parse the response using our schema
    const parseResult = registerResponseSchema.safeParse(rawResult);

    if (!parseResult.success) {
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "error") {
      throw new AuthError(result.message, result.errors);
    }

    analytics.trackEvent("user_registered", {
      email: credentials.email,
    });

    store.trigger.fetchUser();

    return {
      user: result.user,
      status: result.status,
      message: result.message,
    };
  },

  async forgotPassword(
    credentials: ForgotPasswordCredentials,
  ): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_URL}/api/users/reset_password`, {
      method: "POST",
      body: JSON.stringify({ user: { email: credentials.email } }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawResult = await response.json();

    const parseResult = forgotPasswordResponseSchema.safeParse(rawResult);

    if (!parseResult.success) {
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "error") {
      throw new AuthError(result.message, result.errors);
    }

    analytics.trackEvent("user_forgot_password", {
      email: credentials.email,
    });

    return {
      status: result.status,
      message: result.message,
    };
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/api/users/log_out`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    analytics.trackEvent("user_logged_out");

    store.trigger.fetchUser();
  },

  async updatePassword(
    token: string,
    credentials: UpdatePasswordCredentials,
  ): Promise<{ status: string; message: string; user: { email: string } }> {
    const response = await fetch(
      `${API_URL}/api/users/reset_password/${token}`,
      {
        method: "PUT",
        body: JSON.stringify({ user: credentials }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const rawResult = await response.json();

    const parseResult = updatePasswordResponseSchema.safeParse(rawResult);

    if (!parseResult.success) {
      throw new Error("Invalid response format from server");
    }

    const result = parseResult.data;

    if (result.status === "error") {
      throw new AuthError(result.message, result.errors);
    }

    analytics.trackEvent("user_updated_password");

    return {
      status: result.status,
      message: result.message,
      user: result.user,
    };
  },

  async getCurrentUser(origin: string): Promise<UserResponse | null> {
    try {
      const response = await fetch(`${origin}/api/users/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();

      analytics.identifyUser({
        email: result.user.email,
        id: result.user.id,
      });

      return result;
    } catch (_) {
      return null;
    }
  },

  async confirmEmail(token: string): Promise<ConfirmEmailResponse> {
    const response = await fetch(`${API_URL}/api/users/confirm/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    analytics.trackEvent("user_confirmed_email");

    if (!response.ok) {
      throw new Error("Failed to confirm email");
    }

    return response.json();
  },
};

export default authService;
