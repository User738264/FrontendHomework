import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { appwriteService } from '../appwrite/client';
import { type Presentation } from '../types';
import { safeParsePresentation } from '../appwrite/schema';
import type { RootState } from './index';

interface ServerState {
  presentations: Array<{
    $id: string;
    title: string;
    presentation: Presentation;
    createdAt: string;
    updatedAt: string;
  }>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: string | null;
  autoSaveEnabled: boolean;
  currentPresentationId: string | null;
  initialLoadDone: boolean;
}

const initialState: ServerState = {
  presentations: [],
  loading: false,
  saving: false,
  error: null,
  lastSaved: null,
  autoSaveEnabled: false,
  currentPresentationId: null,
  initialLoadDone: false
};

export const loadPresentations = createAsyncThunk(
  'server/loadPresentations',
  async () => {
    const presentations = await appwriteService.getUserPresentations();
    return presentations;
  }
);

export const savePresentation = createAsyncThunk(
  'server/savePresentation',
  async (presentation: Presentation, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const currentPresentationId = state.server.currentPresentationId;
      
      console.log('Saving with current ID:', currentPresentationId);
      
      const result = await appwriteService.savePresentation(presentation, currentPresentationId);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Save failed');
    }
  }
);

export const loadPresentation = createAsyncThunk(
  'server/loadPresentation',
  async (id: string, { rejectWithValue }) => {
    try {
      const doc = await appwriteService.getPresentation(id);
      console.log('Loaded document from Appwrite:', doc);
      
      if (!doc || !doc.presentation) {
        console.error('No presentation field in document:', doc);
        return rejectWithValue('No presentation data found');
      }
      
      const parsed = safeParsePresentation(doc.presentation);
      
      if (!parsed) {
        console.error('Failed to parse presentation:', doc.presentation);
        return rejectWithValue('Invalid presentation format');
      }
      
      console.log('Successfully parsed presentation');
      
      return {
        ...doc,
        presentation: parsed
      };
    } catch (error) {
      console.error('Load presentation error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Load failed');
    }
  }
);

export const deletePresentation = createAsyncThunk(
  'server/deletePresentation',
  async (id: string) => {
    await appwriteService.deletePresentation(id);
    return id;
  }
);

export const uploadImage = createAsyncThunk(
  'server/uploadImage',
  async (file: File) => {
    const url = await appwriteService.uploadImage(file);
    return url;
  }
);

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPresentationId: (state, action: PayloadAction<string | null>) => {
      console.log('Setting current presentation ID:', action.payload);
      state.currentPresentationId = action.payload;
    },
    setInitialLoadDone: (state, action: PayloadAction<boolean>) => {
      state.initialLoadDone = action.payload;
    },
    resetServerState: (state) => {
      state.presentations = [];
      state.currentPresentationId = null;
      state.initialLoadDone = false;
      state.error = null;
      state.lastSaved = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPresentations.fulfilled, (state, action) => {
        state.loading = false;
        
        const validPresentations: typeof state.presentations = [];
        action.payload.forEach(doc => {
          const parsed = safeParsePresentation(doc.presentation);
          if (parsed) {
            validPresentations.push({
              $id: doc.$id,
              title: doc.title,
              presentation: parsed,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt
            });
          } else {
            console.warn('Skipping invalid presentation:', doc.$id);
          }
        });
        
        state.presentations = validPresentations;
        state.initialLoadDone = true;
        
        console.log(`Loaded ${validPresentations.length} valid presentations`);
      })
      .addCase(loadPresentations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load presentations';
        state.initialLoadDone = true;
      })
      .addCase(savePresentation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(savePresentation.fulfilled, (state, action) => {
        state.saving = false;
        state.lastSaved = new Date().toISOString();
        
        const newId = action.payload.$id;
        console.log('Save successful, new ID:', newId);
        state.currentPresentationId = newId;
        
        const parsedPresentation = safeParsePresentation(action.payload.presentation);
        if (!parsedPresentation) {
          console.error('Failed to parse saved presentation');
          state.error = 'Failed to parse saved presentation';
          return;
        }
        
        const updatedPresentation = {
          $id: action.payload.$id,
          title: action.payload.title,
          presentation: parsedPresentation,
          createdAt: action.payload.createdAt || new Date().toISOString(),
          updatedAt: action.payload.updatedAt || new Date().toISOString()
        };
        
        const index = state.presentations.findIndex(p => p.$id === action.payload.$id);
        if (index !== -1) {
          console.log('Updating existing presentation in local list');
          state.presentations[index] = updatedPresentation;
        } else {
          console.log('Adding new presentation to local list');
          state.presentations.push(updatedPresentation);
        }
        
        console.log('Presentation saved successfully:', action.payload.$id);
      })
      .addCase(savePresentation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string || 'Failed to save presentation';
      })
      .addCase(loadPresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPresentation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPresentationId = action.payload.$id;
        console.log('Presentation loaded successfully. ID set to:', action.payload.$id);
      })
      .addCase(loadPresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to load presentation';
      })
      .addCase(deletePresentation.fulfilled, (state, action) => {
        state.presentations = state.presentations.filter(p => p.$id !== action.payload);
        if (state.currentPresentationId === action.payload) {
          state.currentPresentationId = null;
        }
      })
      .addCase(uploadImage.pending, (state) => {
        state.error = null;
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to upload image';
      });
  }
});

export const { 
  setAutoSave, 
  clearError, 
  setCurrentPresentationId,
  setInitialLoadDone,
  resetServerState 
} = serverSlice.actions;
export default serverSlice.reducer;