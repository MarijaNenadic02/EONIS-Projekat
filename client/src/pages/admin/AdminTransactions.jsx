import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import { money, date } from "../../lib/format.js";
import Pagination from "../../components/Pagination.jsx";

// Stripe transactions recorded by the webhook. Satisfies the spec requirement
// that the admin sees, per payment: which product, at what price, what quantity,
// and from which customer.
export default function AdminTransactions() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["payments", { page }],
    queryFn: async () =>
      (await api.get("/checkout/payments", { params: { page, pageSize: 10 } }))
        .data,
  });

  return (
    <div>
      <h1 className="mb-2 text-3xl">Transactions</h1>
      <p className="mb-4 text-sm text-ink/50">
        Payments confirmed by the Stripe webhook.
      </p>

      {isLoading ? (
        <p className="py-10 text-center text-ink/50">Loading…</p>
      ) : data?.items.length === 0 ? (
        <p className="py-10 text-center text-ink/50">
          No transactions yet. Complete a Stripe test checkout to see one here.
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Products</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-ink/5 align-top">
                  <td className="p-3 whitespace-nowrap">{date(p.createdAt)}</td>
                  <td className="p-3">#{p.orderId}</td>
                  <td className="p-3">
                    {p.order.user.firstName} {p.order.user.lastName}
                    <div className="text-xs text-ink/40">{p.order.user.email}</div>
                  </td>
                  <td className="p-3">
                    {p.order.items.map((it) => (
                      <div key={it.id}>
                        {it.product.name} × {it.quantity} @ {money(it.unitPrice)}
                      </div>
                    ))}
                  </td>
                  <td className="p-3 font-semibold">{money(p.amount)}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPage={setPage}
      />
    </div>
  );
}
