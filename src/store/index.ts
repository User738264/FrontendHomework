import { configureStore } from '@reduxjs/toolkit';
import presentationReducer from './presentation/presentationSlice';
import authReducer from './authSlice';
import serverReducer from './serverSlice';
import { historyMiddleware } from './middleware/historyMiddleware';

export const store = configureStore({
  reducer: {
    presentation: presentationReducer,
    auth: authReducer,
    server: serverReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;