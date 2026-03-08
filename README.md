# Генератор ИИ изображений

Веб-приложение для генерации изображений с помощью искусственного интеллекта.

## Возможности

- Генерация изображений по текстовому описанию
- Сохранение истории запросов
- Галерея сгенерированных изображений
- Использование сохранённых промптов для новой генерации

## Технологии

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, sql.js
- **AI:** RouterAI (FLUX.2)

## Установка

### Клонирование репозитория

```bash
git clone https://github.com/morser16031958-2025/aigenpic.git
cd aigenpic
```

### Установка зависимостей

```bash
# Frontend
cd aigenpic-react
npm install

# Backend
cd ../aigenpic-server
npm install
```

### Запуск

#### Режим разработки

Терминал 1 (Backend):
```bash
cd aigenpic-server
node server.js
```

Терминал 2 (Frontend):
```bash
cd aigenpic-react
npm run dev
```

#### Продакшен

```bash
cd aigenpic-server
pm2 start server.js --name aigenpic
```

## Конфигурация

Создайте файл `.env` в папке `aigenpic-server`:

```env
ROUTERAI_API_KEY=your_api_key
ACCESS_CODE=your_access_code
PORT=3000
```

## Структура проекта

```
aigenpic/
├── aigenpic-react/     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/ # React компоненты
│   │   ├── api/       # API клиент
│   │   └── types.ts   # TypeScript типы
│   └── dist/          # Скомпилированные файлы
└── aigenpic-server/   # Backend (Node.js + Express)
    ├── server.js      # Основной файл сервера
    ├── pic/           # Папка с изображениями
    └── app.db         # База данных SQLite
```

## Использование

1. Введите код доступа
2. Введите псевдоним (или создайте новый аккаунт)
3. Введите PIN (4 цифры)
4. Напишите текстовый промпт для генерации изображения
5. Нажмите "Генерировать"

## Лицензия

MIT
