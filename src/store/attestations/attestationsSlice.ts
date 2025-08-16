import { createSlice } from '@reduxjs/toolkit';

export interface attestationsState {
  attestations: any[];
  attestation: any | null;
}

const initialState: attestationsState = {
  attestations: [],
  attestation: null,
};

export const attestationsSlice = createSlice({
  name: 'attestations',
  initialState,
  reducers: {},
});
