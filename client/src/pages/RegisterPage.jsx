import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

export default function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await signup(data);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(apiError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6">
        {serverError && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{serverError}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" {...register("firstName")} />
            {errors.firstName && (
              <p className="field-error">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" {...register("lastName")} />
            {errors.lastName && (
              <p className="field-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>
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
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
        <p className="text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
