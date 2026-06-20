import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const link = ({ isActive }) =>
    `text-sm transition hover:text-gold ${isActive ? "text-gold" : "text-ink/80"}`;

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-wide">
          ESSENCE<span className="text-gold">.</span>
        </Link>

        <div className="flex items-center gap-5">
          <NavLink to="/" className={link} end>
            Shop
          </NavLink>

          {user && (
            <NavLink to="/orders" className={link}>
              My Orders
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={link}>
              Admin
            </NavLink>
          )}

          {user && (
            <Link to="/cart" className="relative text-sm text-ink/80 hover:text-gold">
              Cart
              {cart?.count > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-gold px-1.5 text-xs text-white">
                  {cart.count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink/60 sm:inline">
                {user.firstName}
              </span>
              <button
                className="btn-outline"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
