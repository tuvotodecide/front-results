export const DEV_AUTH_COOKIE = "tvd_dev_session";
export const DEV_AUTH_COOKIE_VALUE = "superadmin";

export const isDevAuthEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  (process.env.ENABLE_DEV_AUTH === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === "true");

export const devSuperadminSession = {
  isDevSession: true,
  role: "SUPERADMIN",
  active: true,
  activeContext: {
    type: "GLOBAL_ADMIN",
    role: "SUPERADMIN",
    label: "Superadmin local",
  },
  defaultContext: {
    type: "GLOBAL_ADMIN",
    role: "SUPERADMIN",
    label: "Superadmin local",
  },
  availableContexts: [
    {
      type: "GLOBAL_ADMIN",
      role: "SUPERADMIN",
      label: "Superadmin local",
    },
  ],
  user: {
    id: "dev-superadmin-local",
    email: "superadmin.local@tuvotodecide.dev",
    name: "Superadmin Local",
    role: "SUPERADMIN",
    active: true,
    status: "ACTIVE",
  },
} as const;
