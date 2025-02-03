export const DEMO_USER_IDS = {
  WITH_HISTORY: 'demo-user-with-history',
  NEW_USER: 'demo-user-new',
} as const;

export type DemoUserId = (typeof DEMO_USER_IDS)[keyof typeof DEMO_USER_IDS];
