# Road Help — ПЗ2: REST API

Практическое занятие №2. REST API сервиса помощи на дорогах: три ресурса (пользователи, диспетчеры, заявки),
CRUD-операции, валидация входных данных и документация в файле `API.md`.

Данные хранятся в массивах в памяти приложения (без базы данных), как требует задание.

## Запуск

```bash
cd pz2-api
npm install
npm run dev
```

Сервер запускается на `http://localhost:3006` (порт можно изменить переменной `PORT`).

## Структура

```
pz2-api/
├── server.js                 настройка Express, подключение маршрутов, обработка 404 и 500
├── data.js                   массивы пользователей, диспетчеров и заявок
├── utils/validate.js         функции валидации (email, телефон, перечисления, числа)
├── controllers/
│   ├── usersController.js     логика CRUD пользователей и их заявок
│   ├── operatorsController.js логика CRUD диспетчеров
│   └── requestsController.js  логика CRUD заявок, смена статуса, назначение диспетчера
├── routes/
│   ├── users.js
│   ├── operators.js
│   └── requests.js
├── API.md                    документация всех эндпоинтов
└── package.json
```

## Ресурсы и операции

| Ресурс | CRUD | Дополнительно |
|---|---|---|
| `/users` | GET, GET/:id, POST, PUT, PATCH, DELETE | GET /users/:id/requests — заявки пользователя |
| `/operators` | GET, GET/:id, POST, PUT, PATCH, DELETE | GET /operators/:id/requests — заявки диспетчера |
| `/requests` | GET, GET/:id, POST, PUT, PATCH, DELETE | PATCH /requests/:id/status, PATCH /requests/:id/operator |

Полное описание запросов, тел и ответов — в `API.md`.

## Валидация

Проверяются обязательные поля, формат email и телефона, допустимые значения статуса (`new`, `in_progress`,
`completed`) и смены (`day`, `night`), существование связанных ресурсов (`userId`, `operatorId`).
При ошибке возвращается статус 400 с массивом сообщений в поле `details`. Повтор email возвращает 409,
попытка удалить пользователя или диспетчера с заявками — 409.

## Примеры проверки

```bash
curl http://localhost:3006/requests
curl "http://localhost:3006/requests?status=new&limit=5"
curl -X POST http://localhost:3006/requests -H "Content-Type: application/json" \
  -d '{"description":"Пробито колесо","location":"Минск, ул. Гикало, 9","userId":1}'
curl -X PATCH http://localhost:3006/requests/1/status -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'
curl -X DELETE http://localhost:3006/requests/1 -i
```
