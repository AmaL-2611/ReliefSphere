/**
 * donorRoutes.js
 * Centralized route config for the Donor section of ReliefSphere AI.
 * Used for documentation / reference — the actual routes are registered in App.js.
 *
 * Route structure:
 *   /donor-dashboard/*   → DonorDashboard (index = DonorHome)
 *   /donor/*             → DonorDashboard (same component, alias)
 *     ├── create-donation  → CreateDonation
 *     ├── my-donations     → MyDonations
 *     ├── track-donation   → TrackDonation
 *     └── profile          → DonorProfile
 */

export const DONOR_ROUTES = {
  dashboard: "/donor-dashboard",
  createDonation: "/donor/create-donation",
  myDonations: "/donor/my-donations",
  trackDonation: "/donor/track-donation",
  profile: "/donor/profile",
};

export default DONOR_ROUTES;
