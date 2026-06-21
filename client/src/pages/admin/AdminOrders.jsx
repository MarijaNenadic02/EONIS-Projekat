import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../api/client.js";
import { money, date } from "../../lib/format.js";
import { StatusBadge } from "../OrdersPage.jsx";
import Pagination from "../../components/Pagination.jsx";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

export default function AdminOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["orders", "all", { page }],
    queryFn: async () =>
      (await api.get("/orders", { params: { all: true, page, pageSize: 10 } }))
        .data,
  });

  const setStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-3xl">Orders</h1>
      <div className="space-y-3">
        {data?.items.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">Order #{o.id}</span>
                <span className="ml-3 text-sm text-ink/50">
                  {o.user.firstName} {o.user.lastName} · {o.user.email}
                </span>
                <span className="ml-3 text-sm text-ink/40">{date(o.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                <select
                  className="input w-auto py-1 text-sm"
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="mt-2 text-sm text-ink/70">
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.product.name} × {it.quantity} · {money(it.unitPrice * it.quantity)}
                </li>
              ))}
            </ul>
            <div className="mt-2 text-right font-semibold">{money(o.total)}</div>
          </div>
        ))}
        {data?.items.length === 0 && (
          <p className="py-10 text-center text-ink/50">No orders yet.</p>
        )}
      </div>
      <Pagination
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPage={setPage}
      />
    </div>
  );
}
