import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

// Example sidebar menu config
const MENU = [
  { id: "tip-now-v1", label: "Tip Now V1" },
  { id: "tip-now-v2", label: "Tip Now V2" },
  { id: "tip-now-v3", label: "Tip Now V3" },

  { id: "nearby-discovery-v1", label: "Nearby Discovery V1" },
  { id: "nearby-discovery-v2", label: "Nearby Discovery V2" },
  { id: "nearby-discovery-v3", label: "Nearby Discovery V3" },

  { id: "tip-receipt-v1", label: "Tip Receipt V1" },

  { id: "pro-mini-profile-v1", label: "Pro Mini Profile V1" },
  { id: "pro-mini-profile-v2", label: "Pro Mini Profile V2" },

  { id: "pro-full-profile-v1", label: "Pro Full Profile V1" },
  { id: "pro-full-profile-v2", label: "Pro Full Profile V2" },

  { id: "tip-confirmation-v1", label: "Tip Confirmation V1" },

  { id: "tip-success-v1", label: "Tip Success V1" },

  { id: "saved-pros-v1", label: "Saved Pros V1" },

  { id: "pro-availability-v1", label: "Pro Availability V1" },

  { id: "wallet-history-v1", label: "Wallet History V1" },

  { id: "report-dispute-v1", label: "Report Dispute V1" },

  { id: "case-status-v1", label: "Case Status V1" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState(""); // for collapsible sections (if needed)
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3 z-20 shadow-sm">
        {/* <img src={BlackLogo} alt="Logo" className="w-[120px]" /> */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-700 focus:outline-none"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col overflow-hidden transform transition-transform duration-300 z-30
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-200 flex-shrink-0 hidden md:flex">
          <p
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "0px",
            }}
          >
            Tip On the Go
          </p>
        </div>

        {/* Sidebar menu */}
        <nav className="p-3 overflow-y-auto flex-1">
          {MENU.map((m) => (
            <div key={m.id} className="mb-1">
              <Link
                to={`/${m.id}`}
                onClick={() => setSidebarOpen(false)} // close on mobile
                className={`block px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-100 ${
                  location.pathname === `/${m.id}`
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-700"
                }`}
              >
                {m.label}
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:ml-0 pt-[60px] md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
