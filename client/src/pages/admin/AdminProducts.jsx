import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, uploadImage } from "../../api/client.js";
import { money } from "../../lib/format.js";
import Modal from "../../components/Modal.jsx";
import Pagination from "../../components/Pagination.jsx";

const schema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be > 0"),
  stock: z.coerce.number().int().min(0),
  volumeMl: z.coerce.number().int().positive(),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
  imageUrl: z.string().url("Must be a valid URL"),
  brandId: z.coerce.number().int({ message: "Select a brand" }),
  categoryId: z.coerce.number().int({ message: "Select a category" }),
});

export default function AdminProducts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} | product
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey: ["products", { page, q: search, admin: true }],
    queryFn: async () =>
      (
        await api.get("/products", {
          params: { page, pageSize: 8, q: search, sort: "createdAt", order: "desc" },
        })
      ).data,
  });
  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await api.get("/brands")).data,
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const del = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      refresh();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl">Products</h1>
        <button className="btn-primary" onClick={() => setEditing({})}>
          + New product
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
          placeholder="Search products…"
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
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-t border-ink/5">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.brand.name}</td>
                <td className="p-3">{money(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right">
                  <button
                    className="text-gold hover:underline"
                    onClick={() => setEditing(p)}
                  >
                    Edit
                  </button>
                  <button
                    className="ml-3 text-red-600 hover:underline"
                    onClick={() => del(p.id)}
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
        <ProductForm
          product={editing.id ? editing : null}
          brands={brands || []}
          categories={categories || []}
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

function ProductForm({ product, brands, categories, error, setError, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          volumeMl: product.volumeMl,
          gender: product.gender,
          imageUrl: product.imageUrl,
          brandId: product.brandId,
          categoryId: product.categoryId,
        }
      : { gender: "UNISEX" },
  });

  const [uploading, setUploading] = useState(false);
  const imageUrl = watch("imageUrl");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setValue("imageUrl", url, { shouldValidate: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values) => {
    setError("");
    try {
      if (product) await api.put(`/products/${product.id}`, values);
      else await api.post("/products", values);
      onSaved();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const Err = ({ name }) =>
    errors[name] ? <p className="field-error">{errors[name].message}</p> : null;

  return (
    <Modal title={product ? "Edit product" : "New product"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}
        <div>
          <label className="label">Name</label>
          <input className="input" {...register("name")} />
          <Err name="name" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} {...register("description")} />
          <Err name="description" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Price</label>
            <input type="number" step="0.01" className="input" {...register("price")} />
            <Err name="price" />
          </div>
          <div>
            <label className="label">Stock</label>
            <input type="number" className="input" {...register("stock")} />
            <Err name="stock" />
          </div>
          <div>
            <label className="label">Volume (ml)</label>
            <input type="number" className="input" {...register("volumeMl")} />
            <Err name="volumeMl" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Gender</label>
            <select className="input" {...register("gender")}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <select className="input" {...register("brandId")}>
              <option value="">Select…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Err name="brandId" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" {...register("categoryId")}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Err name="categoryId" />
          </div>
        </div>
        <div>
          <label className="label">Product image</label>
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-cream-deep">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-[10px] text-ink-muted">
                  No image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="btn-outline cursor-pointer">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-ink-muted">
                JPG, PNG, WEBP or GIF up to 5 MB. Or paste an image URL below.
              </p>
              <input
                className="input"
                placeholder="https://…"
                {...register("imageUrl")}
              />
              <Err name="imageUrl" />
            </div>
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
