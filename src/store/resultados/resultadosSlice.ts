import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../index";

export interface RecintosState {
  recintos: any[];
  recinto: any | null;
}

const initialState: RecintosState = {
  recintos: [],
  recinto: null,
};

export const actasSlice = createSlice({
  name: "actas",
  initialState,
  reducers: {},
});

// export const { setRecintos } = actasSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
