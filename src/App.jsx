import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";

// Import all screen components
import TipNowScreenV1 from "./pages/TipNowScreenV1";
import TipNowScreenV2 from "./pages/TipNowScreenV2";
import TipNowScreenV3 from "./pages/TipNowScreenV3";
import NearbyDiscoveryScreenV1 from "./pages/NearbyDiscoveryScreenV1";
import NearbyDiscoveryScreenV2 from "./pages/NearbyDiscoveryScreenV2";
import NearbyDiscoveryScreenV3 from "./pages/NearbyDiscoveryScreenV3";
import TipReceiptScreenV1 from "./pages/TipReceiptScreenV1";
import ProMiniProfileScreenV1 from "./pages/ProMiniProfileScreenV1";
import ProMiniProfileScreenV2 from "./pages/ProMiniProfileScreenV2";
import ProFullProfileScreenV1 from "./pages/ProFullProfileScreenV1";
import ProFullProfileScreenV2 from "./pages/ProFullProfileScreenV2";
import TipConfirmationScreenV1 from "./pages/TipConfirmationScreenV1";
import TipSuccessScreenV1 from "./pages/TipSuccessScreenV1";
import SavedProsScreenV1 from "./pages/SavedProsScreenV1";
import ProAvailabilityScreenV1 from "./pages/ProAvailabilityScreenV1";
import WalletHistoryScreenV1 from "./pages/WalletHistoryScreenV1";
import ReportDisputeScreenV1 from "./pages/ReportDisputeScreenV1";
import CaseStatusScreenV1 from "./pages/CaseStatusScreenV1";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="/tip-now-v1" replace />} />

        {/* Tip Now Screen - Multiple Versions */}
        <Route path="/tip-now-v1" element={<TipNowScreenV1 />} />
        <Route path="/tip-now-v2" element={<TipNowScreenV2 />} />
        <Route path="/tip-now-v3" element={<TipNowScreenV3 />} />

        {/* Nearby Discovery Screen - Multiple Versions */}
        <Route
          path="/nearby-discovery-v1"
          element={<NearbyDiscoveryScreenV1 />}
        />
        <Route
          path="/nearby-discovery-v2"
          element={<NearbyDiscoveryScreenV2 />}
        />
        <Route
          path="/nearby-discovery-v3"
          element={<NearbyDiscoveryScreenV3 />}
        />

        {/* Tip Receipt Screen */}
        <Route path="/tip-receipt-v1" element={<TipReceiptScreenV1 />} />

        {/* Pro Mini Profile Screen - Multiple Versions */}
        <Route
          path="/pro-mini-profile-v1"
          element={<ProMiniProfileScreenV1 />}
        />
        <Route
          path="/pro-mini-profile-v2"
          element={<ProMiniProfileScreenV2 />}
        />

        {/* Pro Full Profile Screen - Multiple Versions */}
        <Route
          path="/pro-full-profile-v1"
          element={<ProFullProfileScreenV1 />}
        />
        <Route
          path="/pro-full-profile-v2"
          element={<ProFullProfileScreenV2 />}
        />

        {/* Tip Confirmation Screen */}
        <Route
          path="/tip-confirmation-v1"
          element={<TipConfirmationScreenV1 />}
        />

        {/* Tip Success Screen */}
        <Route path="/tip-success-v1" element={<TipSuccessScreenV1 />} />

        {/* Saved Pros Screen */}
        <Route path="/saved-pros-v1" element={<SavedProsScreenV1 />} />

        {/* Pro Availability Screen */}
        <Route
          path="/pro-availability-v1"
          element={<ProAvailabilityScreenV1 />}
        />

        {/* Wallet History Screen */}
        <Route path="/wallet-history-v1" element={<WalletHistoryScreenV1 />} />

        {/* Report Dispute Screen */}
        <Route path="/report-dispute-v1" element={<ReportDisputeScreenV1 />} />

        {/* Case Status Screen */}
        <Route path="/case-status-v1" element={<CaseStatusScreenV1 />} />
      </Route>
    </Routes>
  );
}

export default App;
