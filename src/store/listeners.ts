import { setupListeners } from "@reduxjs/toolkit/query";

export const setupStoreListeners = (
  dispatch: Parameters<typeof setupListeners>[0],
) => setupListeners(dispatch);
