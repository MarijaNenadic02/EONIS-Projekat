import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const link = ({ isActive }) =>
    `relative text-sm tracking-wide transition-colors hover:text-ink ${
      isActive ? "text-ink" : "text-ink-muted"
    } after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-300 ${
      isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-ink/[0.08] bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6">
        <Link
          to="/"
          className="font-serif text-2xl font-semibold tracking-tight"
        >
          ESSENCE<span className="text-gold">.</span>
        </Link>

        <div className="flex items-center gap-7">
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
            <Link
              to="/cart"
              className="relative text-sm tracking-wide text-ink-muted transition-colors hover:text-ink"
            >
              Cart
              {cart?.count > 0 && (
                <span className="absolute -right-4 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-medium text-paper shadow-gold">
                  {cart.count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-ink-muted sm:inline">
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
