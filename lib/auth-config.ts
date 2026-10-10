// Login is off by default. Set NEXT_PUBLIC_AUTH_ENABLED=true (plus the Clerk keys) to require sign-in.
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

// Stand-in user id used to namespace saved answers while login is off.
export const DEMO_USER_ID = "demo";
