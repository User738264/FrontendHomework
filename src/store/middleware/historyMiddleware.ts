import type { Middleware } from 'redux';
import { updateState, undo, redo, clearHistory } from '../presentation/presentationSlice';
import type { RootState } from '../index';

// Actions that should not be saved in history
const EXCLUDED_ACTIONS = [
  'presentation/updateElementPositionWithoutHistory',
  'presentation/updateElementSizeWithoutHistory',
  'presentation/updateGroupPositionWithoutHistory',
  'presentation/selectElements',
  'presentation/selectSlides',
  'server/setLastSaved',
  'server/setSaving',
  'server/setAutoSave',
  'server/setCurrentPresentationId',
  'auth/setUser',
  'auth/setLoading',
];

export const historyMiddleware: Middleware<object, RootState> = (store) => (next) => (action) => {
  const { type } = action;
  const state = store.getState();
  const { past, present, future } = state.presentation;

  // If this is updateState, just pass it through without changes
  if (type === updateState.type) {
    return next(action);
  }

  // Handle undo
  if (type === undo.type) {
    if (past.length === 0) {
      // If no history, just pass the action through
      return next(action);
    }
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const newFuture = [present, ...future];
    
    // Dispatch updateState without saving to history
    next(updateState({
      past: newPast,
      present: previous,
      future: newFuture,
    }));
    
    return;
  }

  // Handle redo
  if (type === redo.type) {
    if (future.length === 0) {
      // If no future states, just pass the action through
      return next(action);
    }
    
    const nextState = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, present];
    
    // Dispatch updateState without saving to history
    next(updateState({
      past: newPast,
      present: nextState,
      future: newFuture,
    }));
    
    return;
  }

  // Handle clearHistory
  if (type === clearHistory.type) {
    next(updateState({
      past: [],
      present,
      future: [],
    }));
    return;
  }

  // Skip excluded actions without saving to history
  if (EXCLUDED_ACTIONS.includes(type)) {
    return next(action);
  }

  // For all other actions, save current state to history
  // Save current state before executing the action
  const currentPresent = present;

  // Execute the action
  const result = next(action);
  
  // Get new state after executing the action
  const newPresent = store.getState().presentation.present;
  
  // If present state changed, save previous state to history
  if (newPresent !== currentPresent) {
    // Use next, not store.dispatch, to avoid recursion
    next(updateState({
      past: [...past, currentPresent],
      present: newPresent,
      future: [], // Clear future on new action
    }));
  }

  return result;
};