import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await login(data.email, data.password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setServerError(apiError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl">Welcome back</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        {serverError && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{serverError}</p>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" {...register("email")} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" {...register("password")} />
          {errors.password && (
            <p className="field-error">{errors.password.message}</p>
          )}
        </div>
        <button className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-ink/60">
          No account?{" "}
          <Link to="/register" className="text-gold hover:underline">
            Create one
          </Link>
        </p>
        <p className="rounded bg-ink/5 p-2 text-center text-xs text-ink/50">
          Demo: admin@scentiq.test / admin123 · customer@scentiq.test / customer123
        </p>
      </form>
    </div>
  );
}
