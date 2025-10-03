import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { AuthGuard } from './components/AuthGuard';
import { PublicGuard } from './components/PublicGuard';
const GooseLoginPage = lazy(() => import('./pages/Login'));
const GooseRoundsPage = lazy(() => import('./pages/Rounds'));
const GooseRoundPage = lazy(() => import('./pages/Round'));

export default function App() {
  return (
    <BrowserRouter>
      <div className="font-sans">
        <Header />
        <Suspense fallback={<div className="p-6">Загрузка...</div>}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicGuard>
                  <GooseLoginPage />
                </PublicGuard>
              }
            />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <GooseRoundsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/rounds/:id"
              element={
                <AuthGuard>
                  <GooseRoundPage />
                </AuthGuard>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
