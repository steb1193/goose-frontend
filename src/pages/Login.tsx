import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function GooseLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const loginMutation = useMutation<Awaited<ReturnType<typeof api.login>>, Error, void>({
    mutationFn: () => api.login(username, password),
    onSuccess: (u) => {
      setUser(u);
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/');
    },
    onError: (e) => {
      setError(e.message || 'Ошибка входа');
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Войти в игру</h2>
      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
      >
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Войти
        </button>
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
      </form>
      <div className="mt-4 text-center text-gray-600 text-sm">
        Если пользователя нет - он будет создан автоматически
      </div>
    </div>
  );
}
