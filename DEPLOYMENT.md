# Запуск фронтенда

**Репозиторий:** [git@github.com:steb1193/goose-frontend.git](git@github.com:steb1193/goose-frontend.git)

## Переменные окружения

Создайте файл `.env` (или `.env.local`) в корне папки `frontend`:

```bash
GOOSE_API_URL=http://localhost:3000     # URL бэкенд API
GOOSE_WS_URL=http://localhost:3000      # URL WebSocket сервера
GOOSE_FRONTEND_PORT=5173               # Порт фронтенд сервера (опционально)
```

## Быстрый запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

## Полезные команды

```bash
npm run lint:fix   # Исправить линтинг
npm run format:fix # Исправить форматирование
```