import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const initialState: AuthState = { user: null, loading: true };

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const { data } = await api.get('/api/auth/me');
  return data.user ?? null;
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ emailOrUsername, password }: { emailOrUsername: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/login', { emailOrUsername, password });
      return data.user;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/register', { username, email, password });
      return data.user;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/api/auth/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => { state.user = action.payload; state.loading = false; })
      .addCase(fetchCurrentUser.rejected, (state) => { state.user = null; state.loading = false; })
      .addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(registerUser.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; });
  },
});

export default authSlice.reducer;
