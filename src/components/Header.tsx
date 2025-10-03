import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth';

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm rounded-b-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-gray-900 transition hover:text-blue-700">
          The Last of Guss
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-700 transition hover:text-blue-600">
            Раунды
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              <span className="max-w-[40ch] truncate text-sm text-gray-600">
                <span className="font-medium text-gray-900">{user.username}</span>
              </span>
              <button
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 transition hover:bg-gray-50 hover:shadow active:scale-95"
                onClick={() => {
                  void logout();
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50 active:scale-95"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
