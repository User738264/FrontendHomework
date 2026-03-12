import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { checkAuth } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EditorPage from './pages/EditorPage';
import PlayerPage from './pages/PlayerPage';

const App: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication when app loads
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/player"
        element={
          <ProtectedRoute>
            <PlayerPage />
          </ProtectedRoute>
        }
      />
      
      {/* Redirect from root to editor or login */}
      <Route path="/" element={<Navigate to="/editor" replace />} />
      
      {/* Handle non-existent routes */}
      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );
};

export default App;