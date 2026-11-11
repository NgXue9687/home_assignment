// store.ts
import { configureStore } from "@reduxjs/toolkit";
import sysConfigReducer from "./sysConfigslice";

export const store = configureStore({
  reducer: { sysConfig: sysConfigReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;