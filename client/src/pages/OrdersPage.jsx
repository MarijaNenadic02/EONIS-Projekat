import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { money, date } from "../lib/format.js";

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] || "bg-ink/10"
      }`}
    >
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get("/orders")).data,
  });

  if (isLoading) return <p className="py-20 text-center text-ink/50">Loading…</p>;

  if (!data?.items.length)
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl">No orders yet</h1>
        <p className="mt-2 text-ink/60">Your placed orders will appear here.</p>
      </div>
    );

  return (
    <div>
      <h1 className="mb-6 text-3xl">My orders</h1>
      <div className="space-y-4">
        {data.items.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Order #{o.id}</span>
                <span className="ml-3 text-sm text-ink/50">{date(o.createdAt)}</span>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <ul className="mt-3 divide-y divide-ink/5 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between py-1.5">
                  <span>
                    {it.product.name} × {it.quantity}
                  </span>
                  <span>{money(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-right font-semibold">
              Total: {money(o.total)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
