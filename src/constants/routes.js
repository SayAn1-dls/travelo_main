// Travelo Route Command — Single source of truth for all navigation paths
export const ROUTES = {
  HOME:       '/',
  AUTH:       '/auth',
  DASHBOARD:  '/dashboard',
  TRIPS:      '/trips',
  MISSION:    '/mission',
  BOARDING:   '/boarding-pass',
  SQUAD:      '/squad',
  VAULT:      '/vault',
  PROFILE:    '/profile',
  SETTINGS:   '/settings',
  NOT_FOUND:  '*',
};

export const NAV_ITEMS = [
  { label: 'DASHBOARD', path: ROUTES.DASHBOARD },
  { label: 'TRIPS',     path: ROUTES.TRIPS },
  { label: 'VAULT',     path: ROUTES.VAULT },
  { label: 'SQUAD',     path: ROUTES.SQUAD },
];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.TRIPS,
  ROUTES.MISSION,
  ROUTES.BOARDING,
  ROUTES.SQUAD,
  ROUTES.VAULT,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
];

export default ROUTES;
