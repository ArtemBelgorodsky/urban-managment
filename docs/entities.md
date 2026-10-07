# Сущности и данные для заполнения Mokky

Коллекции: `users`, `divisions`, `districts`, `infrastructure_objects`, `applications`,
`application_history`, `works`. Создаются в личном кабинете Mokky (https://9e464d3475d6b355.mokky.dev).

> ВАЖНО: `id` ниже — ссылочные номера. Mokky присваивает id автоматически при добавлении.
> Так как другие сущности ссылаются на пользователей (1–7), районы (1–8), подразделения (1–5)
> и объекты (1–15), вставляйте коллекции в порядке: users → districts → divisions →
> infrastructure_objects → applications → application_history → works.
>
> Если пользователи создаются через `/register` (рекомендуется для входа), пароль Mokky хранит
> в защищённом виде и в `GET /users` не возвращает; поле `password` в коллекции остаётся
> только у записей, добавленных вручную из панели. Демо-вход после заполнения:
> `admin@city.ru`, `head@city.ru`, `specialist1-3@city.ru`, пароль — `123456`.

## users

```json
users
[
  {
    "id": 1,
    "fullName": "Кузнецов Дмитрий Олегович",
    "email": "specialist4@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-06",
    "role": "specialist",
    "divisionId": null
  },
  {
    "id": 2,
    "fullName": "Фёдорова Мария Викторовна",
    "email": "specialist5@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-07",
    "role": "specialist",
    "divisionId": null
  },
  {
    "id": 3,
    "fullName": "Иванов Иван Иванович",
    "email": "specialist1@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-03",
    "role": "specialist",
    "divisionId": 1
  },
  {
    "id": 4,
    "fullName": "Петров Пётр Петрович",
    "email": "specialist2@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-04",
    "role": "specialist",
    "divisionId": 2
  },
  {
    "id": 5,
    "fullName": "Сидорова Анна Сергеевна",
    "email": "specialist3@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-05",
    "role": "specialist",
    "divisionId": 3
  },
  {
    "id": 6,
    "fullName": "Смирнов Андрей Петрович",
    "email": "admin@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-01",
    "role": "admin",
    "divisionId": null
  },
  {
    "id": 7,
    "fullName": "Ковалёва Ольга Николаевна",
    "email": "head@city.ru",
    "password": "123456",
    "phone": "+7 (900) 111-00-02",
    "role": "head",
    "divisionId": null
  }
]
```

## divisions

```json
divisions
[
  {
    "id": 1,
    "name": "Управление дорожного хозяйства",
    "description": "Дороги, тротуары, мосты",
    "headUserId": 3
  },
  {
    "id": 2,
    "name": "Служба светофорного хозяйства",
    "description": "Светофоры и дорожные знаки",
    "headUserId": 4
  },
  {
    "id": 3,
    "name": "Служба уличного освещения",
    "description": "Освещение улиц и дворов",
    "headUserId": 5
  },
  {
    "id": 4,
    "name": "Управление благоустройства",
    "description": "Парки, площадки, зелёные зоны",
    "headUserId": 3
  },
  {
    "id": 5,
    "name": "Служба общественного транспорта",
    "description": "Остановки и инфраструктура ОТ",
    "headUserId": 4
  }
]
```

## districts

```json
districts
[
  {
    "id": 1,
    "name": "Ворошиловский",
    "centerLat": 47.272,
    "centerLng": 39.692
  },
  {
    "id": 2,
    "name": "Железнодорожный",
    "centerLat": 47.192,
    "centerLng": 39.54
  },
  {
    "id": 3,
    "name": "Кировский",
    "centerLat": 47.22,
    "centerLng": 39.708
  },
  {
    "id": 4,
    "name": "Ленинский",
    "centerLat": 47.232,
    "centerLng": 39.7
  },
  {
    "id": 5,
    "name": "Октябрьский",
    "centerLat": 47.222,
    "centerLng": 39.741
  },
  {
    "id": 6,
    "name": "Первомайский",
    "centerLat": 47.261,
    "centerLng": 39.747
  },
  {
    "id": 7,
    "name": "Пролетарский",
    "centerLat": 47.195,
    "centerLng": 39.713
  },
  {
    "id": 8,
    "name": "Советский",
    "centerLat": 47.24,
    "centerLng": 39.61
  }
]
```

## infrastructure_objects

```json
infrastructure_objects
[
  {
    "id": 1,
    "name": "пр. Будённовский, участок у ул. Пушкинской",
    "type": "road",
    "districtId": 4,
    "address": "пр. Будённовский, 25–35",
    "latitude": 47.2218,
    "longitude": 39.7098,
    "condition": "repair",
    "commissioningDate": "2008-05-01",
    "characteristics": { "протяжённость": "0.6 км", "покрытие": "асфальт" },
    "description": "Ямы и выбоины дорожного полотна"
  },
  {
    "id": 2,
    "name": "ул. Пушкинская, 45 (тротуар)",
    "type": "sidewalk",
    "districtId": 4,
    "address": "ул. Пушкинская, 45",
    "latitude": 47.2178,
    "longitude": 39.6984,
    "condition": "fair",
    "commissioningDate": "2012-04-15",
    "characteristics": { "ширина": "2.5 м", "плитка": "брусчатка" },
    "description": ""
  },
  {
    "id": 3,
    "name": "Светофор на пр. Будённовском × ул. Большой Садовой",
    "type": "traffic_light",
    "districtId": 3,
    "address": "пр. Будённовский, 80",
    "latitude": 47.2204,
    "longitude": 39.7121,
    "condition": "repair",
    "commissioningDate": "2015-06-01",
    "characteristics": { "секций": 3, "подсветка": "LED" },
    "description": "Периодические сбои в переключении фаз"
  },
  {
    "id": 4,
    "name": "Остановка «Центральный рынок»",
    "type": "bus_stop",
    "districtId": 7,
    "address": "ул. Большая Садовая, 56",
    "latitude": 47.2187,
    "longitude": 39.7167,
    "condition": "good",
    "commissioningDate": "2018-09-20",
    "characteristics": { "павильон": "крытый", "освещение": true },
    "description": ""
  },
  {
    "id": 5,
    "name": "Линия освещения ул. Верхненольная",
    "type": "lighting",
    "districtId": 4,
    "address": "ул. Верхненольная, 1–20",
    "latitude": 47.2255,
    "longitude": 39.69,
    "condition": "emergency",
    "commissioningDate": "2010-03-10",
    "characteristics": { "опор": 24, "тип_светильников": "ДНАТ 250" },
    "description": "Обрыв провода после ветра"
  },
  {
    "id": 6,
    "name": "Детская площадка, парк им. Октября",
    "type": "children_playground",
    "districtId": 1,
    "address": "пр. Ворошиловский, 35",
    "latitude": 47.2557,
    "longitude": 39.68,
    "condition": "fair",
    "commissioningDate": "2016-07-01",
    "characteristics": { "горка": true, "качели": 2 },
    "description": ""
  },
  {
    "id": 7,
    "name": "Спортивная площадка ул. Малиновского, 15",
    "type": "sport_playground",
    "districtId": 8,
    "address": "ул. Малиновского, 15",
    "latitude": 47.2761,
    "longitude": 39.636,
    "condition": "good",
    "commissioningDate": "2020-08-11",
    "characteristics": { "покрытие": "резиновое", "ворота": 2 },
    "description": ""
  },
  {
    "id": 8,
    "name": "Ворошиловский мост",
    "type": "bridge",
    "districtId": 3,
    "address": "Ворошиловский проспект",
    "latitude": 47.216,
    "longitude": 39.688,
    "condition": "good",
    "commissioningDate": "1965-01-01",
    "characteristics": { "длина": "450 м", "полос": 6 },
    "description": "Проводится плановый мониторинг"
  },
  {
    "id": 9,
    "name": "ул. Большая Садовая, участок у театра",
    "type": "road",
    "districtId": 4,
    "address": "ул. Большая Садовая, 45–60",
    "latitude": 47.2225,
    "longitude": 39.696,
    "condition": "emergency",
    "commissioningDate": "1998-04-01",
    "characteristics": { "протяжённость": "0.4 км", "покрытие": "асфальт" },
    "description": "Крупные провалы дорожного полотна, подмыв"
  },
  {
    "id": 10,
    "name": "Светофор на пр. Ворошиловском × ул. Красноармейской",
    "type": "traffic_light",
    "districtId": 4,
    "address": "пр. Ворошиловский, 45",
    "latitude": 47.2269,
    "longitude": 39.6975,
    "condition": "good",
    "commissioningDate": "2019-05-01",
    "characteristics": { "секций": 4, "камера": true },
    "description": ""
  },
  {
    "id": 11,
    "name": "Ливневая канализация ул. Суворова, 12",
    "type": "storm_drain",
    "districtId": 4,
    "address": "ул. Суворова, 12",
    "latitude": 47.2287,
    "longitude": 39.7047,
    "condition": "repair",
    "commissioningDate": "2005-10-01",
    "characteristics": { "глубина": "3 м", "диаметр": "500 мм" },
    "description": "Замутнение, подтопление при дожде"
  },
  {
    "id": 12,
    "name": "Остановка «Главный автовокзал»",
    "type": "bus_stop",
    "districtId": 5,
    "address": "ул. Сиверса, 1",
    "latitude": 47.2153,
    "longitude": 39.7305,
    "condition": "fair",
    "commissioningDate": "2014-05-12",
    "characteristics": { "павильон": "крытый", "табло": false },
    "description": "Разбита скамейка"
  },
  {
    "id": 13,
    "name": "Детская площадка ул. Зорге, 40",
    "type": "children_playground",
    "districtId": 8,
    "address": "ул. Зорге, 40",
    "latitude": 47.268,
    "longitude": 39.613,
    "condition": "emergency",
    "commissioningDate": "2013-06-01",
    "characteristics": { "горка": true, "качели": 2 },
    "description": "Сломаны качели, торчат болты"
  },
  {
    "id": 14,
    "name": "Освещение ул. Днепровский, 20",
    "type": "lighting",
    "districtId": 6,
    "address": "ул. Днепровский, 20",
    "latitude": 47.211,
    "longitude": 39.766,
    "condition": "repair",
    "commissioningDate": "2011-09-15",
    "characteristics": { "опор": 12, "тип_светильников": "ДНАТ 150" },
    "description": "Три опоры не работают"
  },
  {
    "id": 15,
    "name": "Тротуар ул. Добровольского, 20",
    "type": "sidewalk",
    "districtId": 1,
    "address": "ул. Добровольского, 20",
    "latitude": 47.281,
    "longitude": 39.702,
    "condition": "good",
    "commissioningDate": "2021-10-05",
    "characteristics": { "ширина": "3 м", "плитка": "плитка" },
    "description": ""
  }
]
```

## applications

Поле `photos` — массив ссылок на изображения в интернете (http/https). Фото прикрепляются
при создании/редактировании заявки (формa или стрaница инцидента — кнопка «Прикрепить фото»).

```json
applications
[
  {
    "id": 1,
    "number": "З-2026-0001",
    "objectId": 3,
    "title": "Неисправность светофора на Будённовском",
    "description": "Светофор не переключается, сбои фаз в час пик.",
    "priority": "high",
    "status": "assigned",
    "reporterId": 2,
    "assigneeIds": [4],
    "divisionId": 2,
    "createdAt": "2026-09-29T10:00:00.000Z",
    "deadline": "2026-10-08T18:00:00.000Z",
    "resolvedAt": null,
    "photos": ["https://picsum.photos/seed/svetofor1/800/600", "https://picsum.photos/seed/svetofor2/800/600"],
    "comment": ""
  },
  {
    "id": 2,
    "number": "З-2026-0002",
    "objectId": 9,
    "title": "Провал дорожного полотна на Большой Садовой",
    "description": "Провал глубиной до 30 см, риск аварий.",
    "priority": "critical",
    "status": "in_progress",
    "reporterId": 2,
    "assigneeIds": [3, 4],
    "divisionId": 1,
    "createdAt": "2026-09-30T14:00:00.000Z",
    "deadline": "2026-10-09T18:00:00.000Z",
    "resolvedAt": null,
    "photos": [],
    "comment": "Выставлено ограждение"
  },
  {
    "id": 3,
    "number": "З-2026-0003",
    "objectId": 5,
    "title": "Обрыв уличного освещения на Верхненольной",
    "description": "Улица без освещения, обрыв провода после непогоды.",
    "priority": "high",
    "status": "in_progress",
    "reporterId": 1,
    "assigneeIds": [5],
    "divisionId": 3,
    "createdAt": "2026-10-01T09:00:00.000Z",
    "deadline": "2026-10-10T18:00:00.000Z",
    "resolvedAt": null,
    "photos": ["https://picsum.photos/seed/osveshchenie/800/600"],
    "comment": ""
  },
  {
    "id": 4,
    "number": "З-2026-0004",
    "objectId": 13,
    "title": "Сломаны качели на детской площадке",
    "description": "Качели сломаны, торчат болты — опасно для детей.",
    "priority": "medium",
    "status": "done",
    "reporterId": 1,
    "assigneeIds": [3],
    "divisionId": 4,
    "createdAt": "2026-09-26T10:00:00.000Z",
    "deadline": "2026-10-04T18:00:00.000Z",
    "resolvedAt": "2026-10-05T16:00:00.000Z",
    "photos": [],
    "comment": ""
  },
  {
    "id": 5,
    "number": "З-2026-0005",
    "objectId": 11,
    "title": "Подтопление из ливневой канализации",
    "description": "При дожде вода не уходит, затопляет двор.",
    "priority": "medium",
    "status": "closed",
    "reporterId": 1,
    "assigneeIds": [3],
    "divisionId": 1,
    "createdAt": "2026-09-23T10:00:00.000Z",
    "deadline": "2026-09-29T18:00:00.000Z",
    "resolvedAt": "2026-09-29T12:00:00.000Z",
    "photos": [],
    "comment": "Проведена прочистка"
  },
  {
    "id": 6,
    "number": "З-2026-0006",
    "objectId": 14,
    "title": "Не работают опоры освещения на Днепровском",
    "description": "Три опоры не горят, тёмный участок улицы.",
    "priority": "low",
    "status": "new",
    "reporterId": 1,
    "assigneeIds": [],
    "divisionId": null,
    "createdAt": "2026-10-06T08:00:00.000Z",
    "deadline": null,
    "resolvedAt": null,
    "photos": [],
    "comment": ""
  },
  {
    "id": 7,
    "number": "З-2026-0007",
    "objectId": 12,
    "title": "Разбитая скамейка на автовокзале",
    "description": "Разбита скамейка на остановке, требуется замена.",
    "priority": "low",
    "status": "new",
    "reporterId": 2,
    "assigneeIds": [],
    "divisionId": null,
    "createdAt": "2026-10-06T16:00:00.000Z",
    "deadline": null,
    "resolvedAt": null,
    "photos": [],
    "comment": ""
  }
]
```

## application_history

```json
application_history
[
  { "id": 1, "applicationId": 1, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 2, "createdAt": "2026-09-29T10:00:00.000Z" },
  { "id": 2, "applicationId": 1, "action": "assigned", "description": "Назначен исполнитель", "statusFrom": "new", "statusTo": "assigned", "userId": 4, "createdAt": "2026-09-29T11:00:00.000Z" },
  { "id": 3, "applicationId": 2, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 2, "createdAt": "2026-09-30T14:00:00.000Z" },
  { "id": 4, "applicationId": 2, "action": "assigned", "description": "Назначен исполнитель", "statusFrom": "new", "statusTo": "assigned", "userId": 3, "createdAt": "2026-09-30T15:00:00.000Z" },
  { "id": 5, "applicationId": 2, "action": "started", "description": "Начаты работы, выставлено ограждение", "statusFrom": "assigned", "statusTo": "in_progress", "userId": 3, "createdAt": "2026-10-01T09:00:00.000Z" },
  { "id": 6, "applicationId": 3, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 1, "createdAt": "2026-10-01T09:00:00.000Z" },
  { "id": 7, "applicationId": 3, "action": "assigned", "description": "Назначен исполнитель", "statusFrom": "new", "statusTo": "assigned", "userId": 5, "createdAt": "2026-10-01T10:00:00.000Z" },
  { "id": 8, "applicationId": 3, "action": "started", "description": "Начаты работы", "statusFrom": "assigned", "statusTo": "in_progress", "userId": 5, "createdAt": "2026-10-02T09:00:00.000Z" },
  { "id": 9, "applicationId": 4, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 1, "createdAt": "2026-09-26T10:00:00.000Z" },
  { "id": 10, "applicationId": 4, "action": "assigned", "description": "Назначен исполнитель", "statusFrom": "new", "statusTo": "assigned", "userId": 3, "createdAt": "2026-09-26T11:00:00.000Z" },
  { "id": 11, "applicationId": 4, "action": "started", "description": "Начаты работы", "statusFrom": "assigned", "statusTo": "in_progress", "userId": 3, "createdAt": "2026-10-02T09:00:00.000Z" },
  { "id": 12, "applicationId": 4, "action": "completed", "description": "Качели заменены", "statusFrom": "in_progress", "statusTo": "done", "userId": 3, "createdAt": "2026-10-05T16:00:00.000Z" },
  { "id": 13, "applicationId": 5, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 1, "createdAt": "2026-09-23T10:00:00.000Z" },
  { "id": 14, "applicationId": 5, "action": "assigned", "description": "Назначен исполнитель", "statusFrom": "new", "statusTo": "assigned", "userId": 3, "createdAt": "2026-09-23T11:00:00.000Z" },
  { "id": 15, "applicationId": 5, "action": "completed", "description": "Проведена прочистка", "statusFrom": "in_progress", "statusTo": "done", "userId": 3, "createdAt": "2026-09-29T12:00:00.000Z" },
  { "id": 16, "applicationId": 5, "action": "closed", "description": "Заявка закрыта", "statusFrom": "done", "statusTo": "closed", "userId": 3, "createdAt": "2026-09-29T13:00:00.000Z" },
  { "id": 17, "applicationId": 6, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 1, "createdAt": "2026-10-06T08:00:00.000Z" },
  { "id": 18, "applicationId": 7, "action": "created", "description": "Заявка создана", "statusFrom": null, "statusTo": "new", "userId": 2, "createdAt": "2026-10-06T16:00:00.000Z" }
]
```

## works

```json
works
[
  {
    "id": 1,
    "applicationId": 4,
    "objectId": 13,
    "executorId": 3,
    "title": "Замена качелей на детской площадке",
    "description": "Демонтированы старые качели, установлены новые с креплением",
    "startedAt": "2026-10-02T09:00:00.000Z",
    "finishedAt": "2026-10-05T16:00:00.000Z",
    "materials": "Качели 2 шт, крепёж, бетон 0.2 м3",
    "result": "Площадка в исправном состоянии"
  },
  {
    "id": 2,
    "applicationId": 5,
    "objectId": 11,
    "executorId": 3,
    "title": "Прочистка ливневой канализации",
    "description": "Гидродинамическая прочистка участка",
    "startedAt": "2026-09-26T10:00:00.000Z",
    "finishedAt": "2026-09-29T12:00:00.000Z",
    "materials": "Расходные материалы",
    "result": "Вода после дождя уходит нормально"
  },
  {
    "id": 3,
    "applicationId": 3,
    "objectId": 5,
    "executorId": 5,
    "title": "Замена участка линии освещения",
    "description": "Заменён оборванный участок провода, проверка контактов",
    "startedAt": "2026-10-02T09:00:00.000Z",
    "finishedAt": null,
    "materials": "Провод 120 м, изоляторы",
    "result": ""
  },
  {
    "id": 4,
    "applicationId": 2,
    "objectId": 9,
    "executorId": 3,
    "title": "Ремонт дорожного полотна",
    "description": "Вскрытие провала, устройство основания, укладка асфальта",
    "startedAt": "2026-10-01T09:00:00.000Z",
    "finishedAt": null,
    "materials": "Асфальт 3 т, щебень",
    "result": ""
  }
]
```

## Справочные значения

| Сущность | Поле | Значения |
| --- | --- | --- |
| infrastructure_objects | `type` | `road`, `sidewalk`, `traffic_light`, `bus_stop`, `lighting`, `children_playground`, `sport_playground`, `bridge`, `storm_drain`, `green_zone` |
| infrastructure_objects | `condition` | `good`, `fair`, `repair`, `emergency` |
| applications | `priority` | `low`, `medium`, `high`, `critical` |
| applications | `status` | `new`, `assigned`, `in_progress`, `done`, `closed` |
| application_history | `action` | `created`, `assigned`, `started`, `completed`, `closed`, `commented` |
| users | `role` | `admin`, `head`, `specialist` |
