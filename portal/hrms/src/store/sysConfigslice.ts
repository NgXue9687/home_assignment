import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sysConfigApi } from "../shared/api";
import type { RootState } from "./store";
import { MAX_SUBTASK_DEPTH } from "../shared/constants";

interface SysConfigState {
  values: Record<string, string>;            // { MAX_SUBTASK_LIST_SIZE: "3" }
  status: "idle" | "loading" | "loaded" | "failed";
  error: string | null;
}

const initialState: SysConfigState = { values: {}, status: "idle", error: null };

export const fetchSysConfigs = createAsyncThunk(
  "sysConfig/fetch",
  () => sysConfigApi.list(),
  {
    // Skip if it's already loading or loaded, so it's fetched only once
    condition: (_arg, { getState }) => {
      const { status } = (getState() as RootState).sysConfig;
      return status === "idle" || status === "failed";
    },
  },
);

const sysConfigSlice = createSlice({
  name: "sysConfig",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSysConfigs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSysConfigs.fulfilled, (state, action) => {
        state.status = "loaded";
        // turn the list into a lookup: { MAX_SUBTASK_LIST_SIZE: "3" }
        state.values = Object.fromEntries(
          action.payload.map((config) => [config.sysConfigKey, config.sysConfigValue]),
        );
      })
      .addCase(fetchSysConfigs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Could not load settings";
      });
  },
});

export default sysConfigSlice.reducer;

// Reads the depth limit as a number. Uses the built-in default until loaded,
// or if loading failed (the backend still enforces the real limit).
export const selectMaxSubtaskDepth = (state: RootState): number => {
  const value = Number(state.sysConfig.values.MAX_SUBTASK_LIST_SIZE);
  return Number.isInteger(value) && value >= 0 ? value : MAX_SUBTASK_DEPTH;
};