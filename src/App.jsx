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

// Import all v2 flow components
import TipAmountSelectionScreenV2 from "./pages/v2/TipAmountSelectionScreenV2";
import TipMessagePrivacyScreenV2 from "./pages/v2/TipMessagePrivacyScreenV2";
import TipConfirmPayScreenV2 from "./pages/v2/TipConfirmPayScreenV2";
import TipReminderScreenV2 from "./pages/v2/TipReminderScreenV2";
import WalletTipHistoryScreenV2 from "./pages/v2/WalletTipHistoryScreenV2";
import ShareableReceiptScreenV2 from "./pages/v2/ShareableReceiptScreenV2";
import CaseStatusTimelineScreenV1 from "./pages/v2/CaseStatusTimelineScreenV1";
import CaseStatusTimelineScreenV2 from "./pages/v2/CaseStatusTimelineScreenV2";
import CaseChatScreenV2 from "./pages/v2/CaseChatScreenV2";
import RefundTrackingScreenV2 from "./pages/v2/RefundTrackingScreenV2";
import NotificationPrivacySettingsScreenV2 from "./pages/v2/NotificationPrivacySettingsScreenV2";
import LocationConsentScreenV2 from "./pages/v2/LocationConsentScreenV2";
import NotificationSoftPromptScreenV2 from "./pages/v2/NotificationSoftPromptScreenV2";
import NotificationCategoriesScreenV2 from "./pages/v2/NotificationCategoriesScreenV2";
import PermissionsManagerScreenV2 from "./pages/v2/PermissionsManagerScreenV2";
import QuietHoursTipRulesScreenV2 from "./pages/v2/QuietHoursTipRulesScreenV2";
import PerVenueRulesScreenV2 from "./pages/v2/PerVenueRulesScreenV2";
import NotificationInboxScreenV2 from "./pages/v2/NotificationInboxScreenV2";
import NotificationDetailScreenV2 from "./pages/v2/NotificationDetailScreenV2";
import ProfileAccountSettingsScreenV2 from "./pages/v2/ProfileAccountSettingsScreenV2";
import SecurityDevicesScreenV2 from "./pages/v2/SecurityDevicesScreenV2";
import TipFlowRouterScreenV2 from "./pages/v2/TipFlowRouterScreenV2";

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

        {/* ========== V2 FLOW SCREENS ========== */}

        {/* Tip Amount Selection Screen V2 */}
        <Route
          path="/tip-amount-selection-v2"
          element={<TipAmountSelectionScreenV2 />}
        />

        {/* Tip Message Privacy Screen V2 */}
        <Route
          path="/tip-message-privacy-v2"
          element={<TipMessagePrivacyScreenV2 />}
        />

        {/* Tip Confirm Pay Screen V2 */}
        <Route path="/tip-confirm-pay-v2" element={<TipConfirmPayScreenV2 />} />

        {/* Tip Reminder Screen V2 */}
        <Route path="/tip-reminder-v2" element={<TipReminderScreenV2 />} />

        {/* Wallet Tip History Screen V2 */}
        <Route
          path="/wallet-tip-history-v2"
          element={<WalletTipHistoryScreenV2 />}
        />

        {/* Shareable Receipt Screen V2 */}
        <Route
          path="/shareable-receipt-v2"
          element={<ShareableReceiptScreenV2 />}
        />

        {/* Case Status Timeline Screen V1 */}
        <Route
          path="/case-status-timeline-v1"
          element={<CaseStatusTimelineScreenV1 />}
        />

        {/* Case Status Timeline Screen V2 */}
        <Route
          path="/case-status-timeline-v2"
          element={<CaseStatusTimelineScreenV2 />}
        />

        {/* Case Chat Screen V2 */}
        <Route path="/case-chat-v2" element={<CaseChatScreenV2 />} />

        {/* Refund Tracking Screen V2 */}
        <Route
          path="/refund-tracking-v2"
          element={<RefundTrackingScreenV2 />}
        />

        {/* Notification Privacy Settings Screen V2 */}
        <Route
          path="/notification-privacy-settings-v2"
          element={<NotificationPrivacySettingsScreenV2 />}
        />

        {/* Location Consent Screen V2 */}
        <Route
          path="/location-consent-v2"
          element={<LocationConsentScreenV2 />}
        />

        {/* Notification Soft Prompt Screen V2 */}
        <Route
          path="/notification-soft-prompt-v2"
          element={<NotificationSoftPromptScreenV2 />}
        />

        {/* Notification Categories Screen V2 */}
        <Route
          path="/notification-categories-v2"
          element={<NotificationCategoriesScreenV2 />}
        />

        {/* Permissions Manager Screen V2 */}
        <Route
          path="/permissions-manager-v2"
          element={<PermissionsManagerScreenV2 />}
        />

        {/* Quiet Hours Tip Rules Screen V2 */}
        <Route
          path="/quiet-hours-tip-rules-v2"
          element={<QuietHoursTipRulesScreenV2 />}
        />

        {/* Per Venue Rules Screen V2 */}
        <Route path="/per-venue-rules-v2" element={<PerVenueRulesScreenV2 />} />

        {/* Notification Inbox Screen V2 */}
        <Route
          path="/notification-inbox-v2"
          element={<NotificationInboxScreenV2 />}
        />

        {/* Notification Detail Screen V2 */}
        <Route
          path="/notification-detail-v2"
          element={<NotificationDetailScreenV2 />}
        />

        {/* Profile Account Settings Screen V2 */}
        <Route
          path="/profile-account-settings-v2"
          element={<ProfileAccountSettingsScreenV2 />}
        />

        {/* Security Devices Screen V2 */}
        <Route
          path="/security-devices-v2"
          element={<SecurityDevicesScreenV2 />}
        />

        {/* Tip Flow Router Screen V2 */}
        <Route path="/tip-flow-router-v2" element={<TipFlowRouterScreenV2 />} />
      </Route>
    </Routes>
  );
}

export default App;
