import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import { money } from "../../lib/format.js";

function Stat({ label, value }) {
  return (
    <div className="card p-6">
      <p className="text-sm text-ink/50">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: products } = useQuery({
    queryKey: ["products", { pageSize: 1 }],
    queryFn: async () =>
      (await api.get("/products", { params: { pageSize: 1 } })).data,
  });
  const { data: orders } = useQuery({
    queryKey: ["orders", "all", { pageSize: 1 }],
    queryFn: async () =>
      (await api.get("/orders", { params: { all: true, pageSize: 1 } })).data,
  });
  const { data: users } = useQuery({
    queryKey: ["users", { pageSize: 1 }],
    queryFn: async () =>
      (await api.get("/users", { params: { pageSize: 1 } })).data,
  });
  const { data: payments } = useQuery({
    queryKey: ["payments", { pageSize: 100 }],
    queryFn: async () =>
      (await api.get("/checkout/payments", { params: { pageSize: 100 } })).data,
  });

  const revenue = payments?.items.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <div>
      <h1 className="mb-6 text-3xl">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Products" value={products?.total ?? "…"} />
        <Stat label="Orders" value={orders?.total ?? "…"} />
        <Stat label="Customers" value={users?.total ?? "…"} />
        <Stat label="Revenue (paid)" value={money(revenue)} />
      </div>
    </div>
  );
}
