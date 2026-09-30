# Frontend

Для разработки нужны Node.js 22 и зависимости из `package-lock.json`:

```sh
cd frontend
npm ci
```

Без `frontend/node_modules` редактор не сможет разрешить `react/jsx-runtime`,
типы React и плагины ESLint, даже если production-сборка успешно создаётся в
Docker.

На сервере, где Node.js не установлен, зависимости можно восстановить через
имеющийся Docker-образ:

```sh
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e npm_config_cache=/tmp/npm-cache \
  -v "$PWD/frontend:/app" \
  -w /app \
  node:22-alpine npm ci
```

Проверки проекта:

```sh
npm run typecheck  # только TypeScript
npm run lint       # только ESLint
npm run lint:fix   # безопасные автоисправления ESLint
npm run check      # TypeScript, затем ESLint
```

После первой установки зависимостей в VS Code следует выполнить
