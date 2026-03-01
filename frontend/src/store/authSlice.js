import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../utils/api';

const storedUser = typeof window !== 'undefined' && localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;
const storedToken = (typeof window !== 'undefined' && localStorage.getItem('token')) || null;
const storedProfile = typeof window !== 'undefined' && localStorage.getItem('profile')
  ? JSON.parse(localStorage.getItem('profile'))
  : null;

if (storedToken) {
  setAuthToken(storedToken);
}

const handleError = (err) => err.response?.data?.message || err.message;

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', payload);
    return response.data;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', payload);
    return response.data;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const verifyEmailOtp = createAsyncThunk(
  'auth/verifyEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const verifyResetCode = createAsyncThunk(
  'auth/verifyResetCode',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-reset-code', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/reset-password', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/change-password', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const resendVerificationCode = createAsyncThunk(
  'auth/resendVerification',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-verification', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/profiles/me');
    return response.data;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

export const requestEmailChange = createAsyncThunk(
  'auth/requestEmailChange',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/email-change', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const verifyEmailChange = createAsyncThunk(
  'auth/verifyEmailChange',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/profiles/email-change/verify', payload);
      return response.data;
    } catch (err) {
      return rejectWithValue(handleError(err));
    }
  }
);

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.put('/profiles/me', payload);
    return response.data.profile;
  } catch (err) {
    return rejectWithValue(handleError(err));
  }
});

const initialState = {
  user: storedUser,
  profile: storedProfile,
  token: storedToken,
  status: 'idle',
  profileStatus: 'idle',
  pendingVerificationEmail: null,
  verificationStatus: 'idle',
  verificationError: null,
  verificationMessage: null,
  error: null,
  forgotStatus: 'idle',
  forgotMessage: null,
  forgotError: null,
  verifyResetStatus: 'idle',
  verifyResetMessage: null,
  verifyResetError: null,
  resetStatus: 'idle',
  resetMessage: null,
  resetError: null,
  changePasswordStatus: 'idle',
  changePasswordMessage: null,
  changePasswordError: null
  ,
  resendVerificationStatus: 'idle',
  resendVerificationMessage: null,
  resendVerificationError: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.profile = null;
      state.token = null;
      state.status = 'idle';
      state.profileStatus = 'idle';
      state.error = null;
      state.forgotStatus = 'idle';
      state.forgotMessage = null;
      state.forgotError = null;
      state.resetStatus = 'idle';
      state.resetMessage = null;
      state.resetError = null;
      state.changePasswordStatus = 'idle';
      state.changePasswordMessage = null;
      state.changePasswordError = null;
      state.resendVerificationStatus = 'idle';
      state.resendVerificationMessage = null;
      state.resendVerificationError = null;
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('profile');
      }
    },
    resetVerification(state) {
      state.pendingVerificationEmail = null;
      state.verificationStatus = 'idle';
      state.verificationError = null;
      state.verificationMessage = null;
      state.resendVerificationStatus = 'idle';
      state.resendVerificationMessage = null;
      state.resendVerificationError = null;
    },
    resetPasswordFlows(state) {
      state.forgotStatus = 'idle';
      state.forgotMessage = null;
      state.forgotError = null;
      state.verifyResetStatus = 'idle';
      state.verifyResetMessage = null;
      state.verifyResetError = null;
      state.resetStatus = 'idle';
      state.resetMessage = null;
      state.resetError = null;
      state.changePasswordStatus = 'idle';
      state.changePasswordMessage = null;
      state.changePasswordError = null;
      state.resendVerificationStatus = 'idle';
      state.resendVerificationMessage = null;
      state.resendVerificationError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.profile = action.payload.profile || null;
        state.profileStatus = 'idle';
        state.token = action.payload.token;
        state.error = null;
        setAuthToken(action.payload.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('profile', JSON.stringify(action.payload.profile || null));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.verificationMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pendingVerificationEmail = action.meta.arg.email;
        state.verificationStatus = 'pending';
        state.verificationMessage = action.payload?.message || 'Verification code sent to your email';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.verificationStatus = 'idle';
        state.pendingVerificationEmail = null;
      })
      .addCase(verifyEmailOtp.pending, (state) => {
        state.verificationStatus = 'loading';
        state.verificationError = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.verificationStatus = 'succeeded';
        state.verificationError = null;
        state.pendingVerificationEmail = null;
        state.verificationMessage = null;
        state.user = action.payload.user;
        state.profile = action.payload.profile || null;
        state.token = action.payload.token;
        state.status = 'succeeded';
        setAuthToken(action.payload.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('profile', JSON.stringify(action.payload.profile || null));
        }
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.verificationStatus = 'failed';
        state.verificationError = action.payload;
      })
      .addCase(verifyResetCode.pending, (state) => {
        state.verifyResetStatus = 'loading';
        state.verifyResetError = null;
        state.verifyResetMessage = null;
      })
      .addCase(verifyResetCode.fulfilled, (state, action) => {
        state.verifyResetStatus = 'succeeded';
        state.verifyResetMessage = action.payload?.message || null;
      })
      .addCase(verifyResetCode.rejected, (state, action) => {
        state.verifyResetStatus = 'failed';
        state.verifyResetError = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.forgotStatus = 'loading';
        state.forgotError = null;
        state.forgotMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotStatus = 'succeeded';
        state.forgotMessage = action.payload?.message || null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotStatus = 'failed';
        state.forgotError = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.resetStatus = 'loading';
        state.resetError = null;
        state.resetMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetStatus = 'succeeded';
        state.resetMessage = action.payload?.message || null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetStatus = 'failed';
        state.resetError = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.changePasswordStatus = 'loading';
        state.changePasswordError = null;
        state.changePasswordMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.changePasswordStatus = 'succeeded';
        state.changePasswordMessage = action.payload?.message || null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePasswordStatus = 'failed';
        state.changePasswordError = action.payload;
      })
      .addCase(resendVerificationCode.pending, (state) => {
        state.resendVerificationStatus = 'loading';
        state.resendVerificationError = null;
        state.resendVerificationMessage = null;
      })
      .addCase(resendVerificationCode.fulfilled, (state, action) => {
        state.resendVerificationStatus = 'succeeded';
        state.resendVerificationMessage = action.payload?.message || 'Verification code sent';
      })
      .addCase(resendVerificationCode.rejected, (state, action) => {
        state.resendVerificationStatus = 'failed';
        state.resendVerificationError = action.payload;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.profileStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.profile = action.payload.profile;
        if (action.payload.user) {
          state.user = action.payload.user;
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('profile', JSON.stringify(action.payload.profile));
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileStatus = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileStatus = 'succeeded';
        state.profile = action.payload;
        if (typeof window !== 'undefined') {
          localStorage.setItem('profile', JSON.stringify(action.payload));
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { logout, resetVerification, resetPasswordFlows } = authSlice.actions;
export default authSlice.reducer;
