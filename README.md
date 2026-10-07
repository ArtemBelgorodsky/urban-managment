# ГородИнфра — управление городской инфраструктурой

Веб-приложение для централизованного учёта и управления объектами городской инфраструктуры
(магистерская работа). Реализовано на Vue 3 + Vite + Pinia + Vue Router, карта — Leaflet,
UI — Element Plus, графики — Chart.js. Бэкенд — REST API на Mokky (https://9e464d3475d6b355.mokky.dev).

## Возможности

- Интерактивная карта Ростова-на-Дону (Leaflet + OSM): объекты инфраструктуры цветными
  маркерами по техническому состоянию, активные заявки — пунктирными маркерами.
- Фильтрация объектов по типу, району, состоянию; фильтрация заявок по статусу, приоритету, району.
- Регистрация и авторизация (`/register`, `/auth` Mokky), роли: администратор, руководитель,
  специалист.
- Заявки о неисправностях: создание с фотографиями и приоритетом, назначение исполнителей,
  планирование сроков, фиксация выполненных работ, история изменений, комментарии.
- Администрирование: пользователи, подразделения, районы, объекты.
- Аналитика и отчёты (Chart.js): состояние объектов, заявки по районам/приоритетам/статусам,
  динамика поступления, среднее время устранения по подразделениям, загруженность специалистов.

## Запуск

```sh
npm install
npm run dev
```

Продакшен-сборка: `npm run build`, просмотр: `npm run preview`.

## Структура коллекций REST API (Mokky)

Коллекции создаются в личном кабинете Mokky: `users`, `divisions`, `districts`,
`infrastructure_objects`, `applications`, `application_history`, `works`.

### users

Пользователи системы. Создаются через `/register` Mokky (в приложении — страница регистрации,
раздел «Администрирование», либо скрипт `seed.mjs`):

```js
const res = await fetch("https://9e464d3475d6b355.mokky.dev/register", {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "Иванов Иван Иванович",
    email: "ivanov@example.com",
    password: "123456",
    role: "specialist",
    phone: "+7 (900) 000-00-00"
  })
})
```

Ответ — пользователь и токен: `{ token: "...", data: { id, fullName, email, ... } }`.
Пароль Mokky хранит в защищённом виде и в ответах `GET /users` не возвращает; поле `password`
в коллекции появляется, только если вносить записи вручную из панели Mokky.
Вход выполняется через `/auth` (при недоступности — сверка по коллекции `users`).

Демо-учётные записи после `node scripts/seed.mjs` (пароль всех — `123456`):
`admin@city.ru`, `head@city.ru`, `specialist1@city.ru`, `specialist2@city.ru`,
`specialist3@city.ru`.

`role`: `admin` (администратор) | `head` (руководитель) | `specialist` (специалист).

### divisions

Подразделения служб города.

```json
{
  "id": 1,
  "name": "Управление дорожного хозяйства",
  "description": "Содержание дорог и тротуаров",
  "headUserId": 4
}
```

### districts

Районы Ростова-на-Дону.

```json
{
  "id": 1,
  "name": "Ворошиловский",
  "centerLat": 47.272,
  "centerLng": 39.692
}
```

### infrastructure_objects

Объекты городской инфраструктуры.

```json
{
  "id": 1,
  "name": "пр. Будённовский, 80 (светофор)",
  "type": "traffic_light",
  "districtId": 3,
  "address": "пр. Будённовский, 80",
  "latitude": 47.2204,
  "longitude": 39.7121,
  "condition": "repair",
  "commissioningDate": "2015-06-01",
  "characteristics": { "секций": 3, "подсветка": "LED" },
  "description": "Описание объекта"
}
```

`type`: `road` | `sidewalk` | `traffic_light` | `bus_stop` | `lighting` | `children_playground` |
`sport_playground` | `bridge` | `storm_drain` | `green_zone`.

`condition`: `good` | `fair` | `repair` | `emergency`.

### applications

Заявки о неисправностях и проблемах.

```json
{
  "id": 1,
  "number": "З-2026-0001",
  "objectId": 1,
  "title": "Не работает светофор",
  "description": "Светофор не переключается, сбои в работе",
  "priority": "high",
  "status": "assigned",
  "reporterId": 5,
  "assigneeIds": [2, 3],
  "divisionId": 1,
  "createdAt": "2026-03-12T10:00:00.000Z",
  "deadline": "2026-03-14T18:00:00.000Z",
  "resolvedAt": null,
  "photos": ["https://example.com/photo.jpg"],
  "comment": ""
}
```

`priority`: `low` | `medium` | `high` | `critical`.
`status`: `new` | `assigned` | `in_progress` | `done` | `closed`.

### application_history

История изменений заявки.

```json
{
  "id": 1,
  "applicationId": 1,
  "action": "assigned",
  "description": "Назначены исполнители",
  "statusFrom": "new",
  "statusTo": "assigned",
  "userId": 2,
  "createdAt": "2026-03-12T11:00:00.000Z"
}
```

`action`: `created` | `assigned` | `started` | `completed` | `closed` | `commented`.

### works

Выполненные работы по заявкам.

```json
{
  "id": 1,
  "applicationId": 1,
  "objectId": 1,
  "executorId": 2,
  "title": "Замена блока управления светофора",
  "description": "Выполнена замена контроллера",
  "startedAt": "2026-03-13T09:00:00.000Z",
  "finishedAt": "2026-03-13T15:30:00.000Z",
  "materials": "Контроллер СУ-2, кабель 50 м",
  "result": "Светофор работает в штатном режиме"
}
```

## Настройка

Адрес API задаётся в `src/utils/constants.js` (`API_BASE`). Справочники типов объектов,
состояний, приоритетов, статусов и ролей — там же.
