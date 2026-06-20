import SimpleNameCrud from "./SimpleNameCrud.jsx";

export default function AdminBrands() {
  return <SimpleNameCrud title="Brands" endpoint="/brands" queryKey="brands" />;
}
