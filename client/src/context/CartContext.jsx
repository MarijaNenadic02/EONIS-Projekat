import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

// Server-backed cart. Only fetched when a user is logged in.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get("/cart")).data,
    enabled: !!user,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const add = async (productId, quantity = 1) => {
    const res = await api.post("/cart", { productId, quantity });
    queryClient.setQueryData(["cart"], res.data);
  };
  const update = async (id, quantity) => {
    const res = await api.put(`/cart/${id}`, { quantity });
    queryClient.setQueryData(["cart"], res.data);
  };
  const remove = async (id) => {
    const res = await api.delete(`/cart/${id}`);
    queryClient.setQueryData(["cart"], res.data);
  };

  const items = data?.items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const total = data?.total ?? 0;

  return (
    <CartContext.Provider value={{ items, count, total, add, update, remove, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
