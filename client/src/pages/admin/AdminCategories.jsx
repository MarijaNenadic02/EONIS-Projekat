import SimpleNameCrud from "./SimpleNameCrud.jsx";

export default function AdminCategories() {
  return (
    <SimpleNameCrud
      title="Categories"
      endpoint="/categories"
      queryKey="categories"
    />
  );
}
