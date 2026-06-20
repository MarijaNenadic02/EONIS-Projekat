import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../api/client.js";
import { date } from "../../lib/format.js";
import Modal from "../../components/Modal.jsx";
import Pagination from "../../components/Pagination.jsx";

const baseSchema = {
  email: z.string().email("Valid email required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  role: z.enum(["ADMIN", "CUSTOMER"]),
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["users", { page, q: search }],
    queryFn: async () =>
      (await api.get("/users", { params: { page, pageSize: 8, q: search } })).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });

  const del = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      refresh();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl">Users</h1>
        <button className="btn-primary" onClick={() => setEditing({})}>
          + New user
        </button>
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q);
        }}
      >
        <input
          className="input"
          placeholder="Search users…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-outline">Search</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id} className="border-t border-ink/5">
                <td className="p-3">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.role === "ADMIN"
                        ? "bg-gold/20 text-gold"
                        : "bg-ink/10 text-ink/70"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3">{date(u.createdAt)}</td>
                <td className="p-3 text-right">
                  <button
                    className="text-gold hover:underline"
                    onClick={() => setEditing(u)}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-3 text-red-600 hover:underline"
                    onClick={() => del(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPage={setPage}
      />

      {editing && (
        <UserForm
          user={editing.id ? editing : null}
          error={error}
          setError={setError}
          onClose={() => {
            setEditing(null);
            setError("");
          }}
          onSaved={() => {
            refresh();
            setEditing(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}

function UserForm({ user, error, setError, onClose, onSaved }) {
  const schema = z.object({
    ...baseSchema,
    password: user
      ? z.string().min(6).optional().or(z.literal(""))
      : z.string().min(6, "At least 6 characters"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user
      ? {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          password: "",
        }
      : { role: "CUSTOMER" },
  });

  const onSubmit = async (values) => {
    setError("");
    const payload = { ...values };
    if (!payload.password) delete payload.password;
    try {
      if (user) await api.put(`/users/${user.id}`, payload);
      else await api.post("/users", payload);
      onSaved();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const Err = ({ name }) =>
    errors[name] ? <p className="field-error">{errors[name].message}</p> : null;

  return (
    <Modal title={user ? "Edit user" : "New user"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input className="input" {...register("firstName")} />
            <Err name="firstName" />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" {...register("lastName")} />
            <Err name="lastName" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" {...register("email")} />
          <Err name="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role</label>
            <select className="input" {...register("role")}>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">
              Password {user && <span className="text-ink/40">(leave blank to keep)</span>}
            </label>
            <input type="password" className="input" {...register("password")} />
            <Err name="password" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
