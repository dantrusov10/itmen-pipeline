# ITMen Pipeline — веб-инструмент Q3

Пайплайн сделок, техническое исследование, скоринг. Открытый доступ — откройте ссылку и работайте.

**Публичная ссылка для менеджеров:** см. [DEPLOY.md](./DEPLOY.md) — деплой на Render + MongoDB Atlas (~10 минут).

## Быстрый старт

```bash
cp .env.example .env

npm install
npm run seed    # первичная загрузка данных (один раз)
npm start       # http://localhost:3000
```

## Возможности

- Дашборд пайплайна
- Паспорт сделки (тех. исследование + скоринг)
- Импорт Excel (шаблон для менеджеров)
- Автосохранение на сервер (кнопка 💾 Сохранить)
- Все пользователи видят и редактируют общий пайплайн

## API

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/pipeline` | Получить состояние |
| PUT | `/api/pipeline` | Сохранить состояние |
| GET | `/api/export/template` | Скачать Excel-шаблон |
| GET | `/api/managers` | Список менеджеров (владельцы сделок) |

## Деплой

### Docker

```bash
docker build -t itmen-pipeline .
docker run -p 3000:3000 -v itmen-data:/app/data --env-file .env itmen-pipeline
```

### Railway / Render / VPS

1. Подключите репозиторий Git
2. Build: `npm install`
3. Start: `npm start`
4. Примонтируйте volume к `/app/data` для сохранения `pipeline.json`

## Структура

```
server/          — Express API + JSON storage
js/              — фронтенд
data/            — pipeline.json (создаётся автоматически)
build_*.py       — генераторы шаблонов и architecture-data
```

## Локальная разработка без сервера

Откройте `index.html` напрямую — работает режим localStorage (с `ITMEN_API.enabled = false` в `js/api.js`).
