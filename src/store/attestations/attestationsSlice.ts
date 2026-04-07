import { createSlice } from '@reduxjs/toolkit';
import type { AttestationType } from '../../types';

export interface attestationsState {
  attestations: AttestationType[];
  attestation: AttestationType | null;
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
