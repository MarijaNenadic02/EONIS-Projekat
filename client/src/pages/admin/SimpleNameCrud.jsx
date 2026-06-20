import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../api/client.js";
import Modal from "../../components/Modal.jsx";

// Reusable admin CRUD for entities that only have a `name` (brands, categories).
export default function SimpleNameCrud({ title, endpoint, queryKey }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await api.get(endpoint)).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const open = (item) => {
    setEditing(item || {});
    setName(item?.name || "");
    setError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing.id) await api.put(`${endpoint}/${editing.id}`, { name });
      else await api.post(endpoint, { name });
      refresh();
      setEditing(null);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const del = async (id) => {
    if (!confirm(`Delete this ${title.toLowerCase().slice(0, -1)}?`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      refresh();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl">{title}</h1>
        <button className="btn-primary" onClick={() => open(null)}>
          + New
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((item) => (
              <tr key={item.id} className="border-t border-ink/5">
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-right">
                  <button
                    className="text-gold hover:underline"
                    onClick={() => open(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-3 text-red-600 hover:underline"
                    onClick={() => del(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? `Edit ${title}` : `New ${title}`}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save} className="space-y-3">
            {error && (
              <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
            )}
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={!name.trim()}>
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
