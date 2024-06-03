import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';

import reducer from './reducers';

export const store = configureStore({
  reducer: reducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // serializableCheck: {
      //   ignoredActions: [`${TimeLineTypes.SAVE_AGENT_DAY}/fulfilled`],
      // },
      serializableCheck: false, // TODO: temporary fix
    }),
});

export type RootStore = typeof store;
export type GetRootState = typeof store.getState;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
