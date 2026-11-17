# Road Help — серверная часть на MongoDB (лабораторная работа №6)

Альтернативная реализация API сервиса помощи на дорогах на Node.js + Express + MongoDB (Mongoose).
Реляционная версия проекта на PostgreSQL остаётся в корне репозитория и работает независимо: этот сервер запускается на порту **3001**, чтобы обе реализации можно было сравнить.

## Предметная область и документная модель

Заявка хранится одним документом коллекции `requests`, внутри которого есть вложенные структуры:

- `location` — вложенный документ: адрес, широта, долгота;
- `car` — вложенный документ: марка, модель, номер;
- `tags` — массив видов требуемой помощи;
- `comments` — массив вложенных документов комментариев (у каждого свой `ObjectId` и дата);
- `statusHistory` — массив истории смены статусов;
- `operator` — ссылка на коллекцию `operators` (подгружается методом `populate`).

Коллекции: `requests`, `operators`.

## Запуск

Требуется локальная MongoDB Community Edition и Node.js.

**1. Запустить MongoDB** (демон с конфигурационным файлом `~/mongodb-data/mongod.conf`):

```bash
mongod --config ~/mongodb-data/mongod.conf
```

**2. Остановить MongoDB:**

```bash
pkill -TERM -f "mongod --config"
```

**3. Строка подключения** хранится в `.env` (образец — `.env.example`):

```
MONGO_URI=mongodb://127.0.0.1:27017/road_help
PORT=3001
```

**4. Установить зависимости, заполнить базу и запустить сервер:**

```bash
npm install
npm run seed
npm run dev
```

Сервер будет доступен по адресу `http://localhost:3001`.

## Просмотр данных

MongoDB Compass: подключение `mongodb://127.0.0.1:27017`, база `road_help`, коллекция `requests` — вложенные документы видны в режиме таблицы и JSON.

## Маршруты API

| Метод | Маршрут | Назначение |
|---|---|---|
| GET | /requests | список с фильтрами `search`, `status`, `tag`, пагинацией `page`, `limit` |
| GET | /requests/stats | агрегация: количество по статусам и число заявок с комментариями |
| GET | /requests/tag/:tag | заявки по тегу (статический метод модели) |
| GET | /requests/:id | одна заявка с подгруженным оператором |
| POST | /requests | создание заявки (в историю сразу пишется статус `new`) |
| PUT | /requests/:id | обновление полей заявки |
| PATCH | /requests/:id/status | смена статуса с записью в `statusHistory` |
| PATCH | /requests/:id/operator | назначить диспетчера (ссылка на коллекцию `operators`) |
| POST | /requests/:id/comments | добавить комментарий в массив |
| PATCH | /requests/:id/comments/:commentId | изменить текст комментария в массиве |
| DELETE | /requests/:id/comments/:commentId | удалить комментарий из массива |
| POST | /requests/:id/tags | добавить тег в массив (`$addToSet`) |
| DELETE | /requests/:id/tags/:tag | удалить тег из массива (`$pull`) |
| DELETE | /requests/:id | удалить заявку и вернуть удалённый документ |
| GET | /operators | список диспетчеров |
| POST | /operators | создать диспетчера |
