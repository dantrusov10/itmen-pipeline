# Как получить публичную ссылку для менеджеров

Сейчас `http://localhost:3000` работает **только на вашем компьютере**. Чтобы менеджеры открывали инструмент со своих машин, нужно задеплоить его в облако.

Рекомендуемый вариант: **Render.com** (бесплатный тариф) + **MongoDB Atlas** (бесплатная база для хранения данных).

---

## Шаг 1. Бесплатная база данных (MongoDB Atlas)

1. Зайдите на [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) и создайте аккаунт.
2. Создайте **бесплатный кластер** (M0 Free).
3. В разделе **Database Access** → Add User → задайте логин/пароль (запомните).
4. В **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Нажмите **Connect** у кластера → **Drivers** → скопируйте строку подключения, например:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Замените `<password>` на ваш пароль (если в пароле есть `@`, `#` и т.п. — закодируйте их в URL).

---

## Шаг 2. Деплой на Render

1. Зайдите на [render.com](https://render.com) и войдите через GitHub.
2. **New** → **Blueprint** → подключите репозиторий:
   `https://github.com/dantrusov10/itmen-pipeline`
3. Render подхватит `render.yaml` из репозитория.
4. В переменных окружения задайте:
   - `MONGODB_URI` = строка подключения из шага 1
5. Нажмите **Apply** / **Deploy**.

Через 2–5 минут Render выдаст публичный URL, например:
```
https://itmen-pipeline.onrender.com
```

Эту ссылку отправляйте менеджерам — вход не нужен, открыли и работают.

---

## Важно

| | Локально (`npm start`) | Облако (Render) |
|---|---|---|
| Кто видит | Только вы | Все в интернете |
| Данные | Файл на вашем ПК | MongoDB Atlas |
| ПК должен быть включён | Да | Нет |

**Free tier Render:** сервис «засыпает» после ~15 мин без активности; первый запрос после сна может занять 30–60 сек — это нормально для бесплатного тарифа.

---

## Альтернатива: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Добавьте переменную `MONGODB_URI`.
3. Railway выдаст URL вида `https://itmen-pipeline-production.up.railway.app`.

---

## Локальная разработка

Без `MONGODB_URI` данные пишутся в `data/pipeline.json` (как сейчас).

С облачной базой локально:
```bash
# .env
MONGODB_URI=mongodb+srv://...
npm start
```
