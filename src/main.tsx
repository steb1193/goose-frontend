import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAuth } from './store/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

async function bootstrap() {
  await (useAuth.getState().hydrateFromApi?.() ?? Promise.resolve());

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60_000,
      },
    },
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
