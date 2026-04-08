import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { rootReducer } from "./rootReducer";
import { setupStoreListeners } from "./listeners";

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupStoreListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
