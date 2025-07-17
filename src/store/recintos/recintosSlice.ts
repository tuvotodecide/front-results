import { createSlice } from '@reduxjs/toolkit';

export interface RecintosState {
  recintos: any[];
  recinto: any | null;
}

const initialState: RecintosState = {
  recintos: [],
  recinto: null,
};

export const recintosSlice = createSlice({
  name: 'recintos',
  initialState,
  reducers: {
    setRecintos: (state, action) => {
      state.recintos = action.payload;
    },
  },
});

export const { setRecintos } = recintosSlice.actions;
// export const selectAuth = (state: RootState) => state.auth;
