import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const MENU = [
  {
    id: "customer-menu-v1",
    label: "Customer Menu v1",
    children: [
      { id: "tip-now-v1", label: "Tip Now V1", path: "/tip-now-v1" },
      { id: "tip-now-v2", label: "Tip Now V2", path: "/tip-now-v2" },
      { id: "tip-now-v3", label: "Tip Now V3", path: "/tip-now-v3" },

      {
        id: "nearby-discovery-v1",
        label: "Nearby Discovery V1",
        path: "/nearby-discovery-v1",
      },
      {
        id: "nearby-discovery-v2",
        label: "Nearby Discovery V2",
        path: "/nearby-discovery-v2",
      },
      {
        id: "nearby-discovery-v3",
        label: "Nearby Discovery V3",
        path: "/nearby-discovery-v3",
      },

      {
        id: "tip-receipt-v1",
        label: "Tip Receipt V1",
        path: "/tip-receipt-v1",
      },

      {
        id: "pro-mini-profile-v1",
        label: "Pro Mini Profile V1",
        path: "/pro-mini-profile-v1",
      },
      {
        id: "pro-mini-profile-v2",
        label: "Pro Mini Profile V2",
        path: "/pro-mini-profile-v2",
      },

      {
        id: "pro-full-profile-v1",
        label: "Pro Full Profile V1",
        path: "/pro-full-profile-v1",
      },
      {
        id: "pro-full-profile-v2",
        label: "Pro Full Profile V2",
        path: "/pro-full-profile-v2",
      },

      {
        id: "tip-confirmation-v1",
        label: "Tip Confirmation V1",
        path: "/tip-confirmation-v1",
      },
      {
        id: "tip-success-v1",
        label: "Tip Success V1",
        path: "/tip-success-v1",
      },
      { id: "saved-pros-v1", label: "Saved Pros V1", path: "/saved-pros-v1" },
      {
        id: "pro-availability-v1",
        label: "Pro Availability V1",
        path: "/pro-availability-v1",
      },
      {
        id: "wallet-history-v1",
        label: "Wallet History V1",
        path: "/wallet-history-v1",
      },
      {
        id: "report-dispute-v1",
        label: "Report Dispute V1",
        path: "/report-dispute-v1",
      },
      {
        id: "case-status-v1",
        label: "Case Status V1",
        path: "/case-status-v1",
      },
    ],
  },
  {
    id: "customer-menu-v2",
    label: "Customer Menu v2",
    children: [
      {
        id: "tip-confirm-pay-v2",
        label: "Tip Confirm Pay V2",
        path: "/tip-confirm-pay-v2",
      },
      {
        id: "tip-reminder-v2",
        label: "Tip Reminder V2",
        path: "/tip-reminder-v2",
      },
      {
        id: "wallet-tip-history-v2",
        label: "Wallet Tip History V2",
        path: "/wallet-tip-history-v2",
      },
      {
        id: "shareable-receipt-v2",
        label: "Shareable Receipt V2",
        path: "/shareable-receipt-v2",
      },
      {
        id: "case-status-timeline-v2",
        label: "Case Status Timeline V2",
        path: "/case-status-timeline-v2",
      },
      {
        id: "case-status-timeline-v1",
        label: "Case Status Timeline V1",
        path: "/case-status-timeline-v1",
      },
      {
        id: "case-chat-v2",
        label: "Case Chat V2",
        path: "/case-chat-v2",
      },
      {
        id: "refund-tracking-v2",
        label: "Refund Tracking V2",
        path: "/refund-tracking-v2",
      },
      {
        id: "notification-privacy-settings-v2",
        label: "Notification Privacy Settings V2",
        path: "/notification-privacy-settings-v2",
      },
      {
        id: "location-consent-v2",
        label: "Location Consent V2",
        path: "/location-consent-v2",
      },
      {
        id: "notification-soft-prompt-v2",
        label: "Notification Soft Prompt V2",
        path: "/notification-soft-prompt-v2",
      },
      {
        id: "notification-categories-v2",
        label: "Notification Categories V2",
        path: "/notification-categories-v2",
      },
      {
        id: "permissions-manager-v2",
        label: "Permissions Manager V2",
        path: "/permissions-manager-v2",
      },
      {
        id: "quiet-hours-tip-rules-v2",
        label: "Quiet Hours Tip Rules V2",
        path: "/quiet-hours-tip-rules-v2",
      },
      {
        id: "per-venue-rules-v2",
        label: "Per Venue Rules V2",
        path: "/per-venue-rules-v2",
      },
      {
        id: "notification-inbox-v2",
        label: "Notification Inbox V2",
        path: "/notification-inbox-v2",
      },
      {
        id: "notification-detail-v2",
        label: "Notification Detail V2",
        path: "/notification-detail-v2",
      },
      {
        id: "profile-account-settings-v2",
        label: "Profile Account Settings V2",
        path: "/profile-account-settings-v2",
      },
      {
        id: "security-devices-v2",
        label: "Security Devices V2",
        path: "/security-devices-v2",
      },
      {
        id: "tip-flow-router-v2",
        label: "Tip Flow Router V2",
        path: "/tip-flow-router-v2",
      },
      {
        id: "tip-amount-selection-v2",
        label: "Tip Amount Selection V2",
        path: "/tip-amount-selection-v2",
      },
      {
        id: "tip-message-privacy-v2",
        label: "Tip Message Privacy V2",
        path: "/tip-message-privacy-v2",
      },
    ],
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [open, setOpen] = useState("servicepro-v1");
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3 z-20 shadow-sm">
        <p className="text-base font-bold text-slate-900">
          Tip On the Go (Cutomer Flow)
        </p>
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
          <p className="text-xl font-bold m-0">Tip On the Go (Cutomer Flow)</p>
        </div>

        <nav className="p-3 overflow-y-auto flex-1">
          {MENU.map((section) => (
            <div key={section.id} className="mb-3">
              <button
                onClick={() => setOpen(open === section.id ? "" : section.id)}
                className="w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                {section.label}
                <span>{open === section.id ? "−" : "+"}</span>
              </button>

              {open === section.id && (
                <div className="ml-4 mt-2 space-y-1">
                  {section.children.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`block px-3 py-2 text-sm rounded-lg hover:bg-slate-100 transition-colors ${
                          isActive
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
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
