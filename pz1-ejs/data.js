const STATUSES = ["new", "in_progress", "completed"];

const STATUS_LABELS = {
  new: "Новая",
  in_progress: "В работе",
  completed: "Выполнена",
};

const requests = [
  {
    id: 1,
    description: "Не заводится автомобиль после ночной стоянки",
    location: "Минск, ул. Сурганова, 15",
    status: "new",
    phone: "+375291112233",
    createdAt: new Date("2026-11-10T09:15:00"),
  },
  {
    id: 2,
    description: "Спустило колесо на МКАД",
    location: "Минск, МКАД, 25-й км",
    status: "in_progress",
    phone: "+375292223344",
    createdAt: new Date("2026-11-11T14:40:00"),
  },
  {
    id: 3,
    description: "Закончилось топливо на трассе",
    location: "Минск, МКАД, 10-й км",
    status: "in_progress",
    phone: "+375293334455",
    createdAt: new Date("2026-11-12T08:05:00"),
  },
  {
    id: 4,
    description: "Требуется эвакуатор после ДТП",
    location: "Минск, ул. Притыцкого, 60",
    status: "completed",
    phone: "+375294445566",
    createdAt: new Date("2026-11-13T18:20:00"),
  },
];

let nextId = requests.length + 1;

const getAll = () => requests.slice().sort((a, b) => b.id - a.id);

const getById = (id) => requests.find((item) => item.id === Number(id));

const add = ({ description, location, status, phone }) => {
  const request = {
    id: nextId,
    description,
    location,
    status: STATUSES.includes(status) ? status : "new",
    phone: phone || "",
    createdAt: new Date(),
  };

  nextId += 1;
  requests.push(request);

  return request;
};

const getStats = () => ({
  total: requests.length,
  new: requests.filter((item) => item.status === "new").length,
  inProgress: requests.filter((item) => item.status === "in_progress").length,
  completed: requests.filter((item) => item.status === "completed").length,
});

module.exports = {
  getAll,
  getById,
  add,
  getStats,
  STATUSES,
  STATUS_LABELS,
};
