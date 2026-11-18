const { users, requests, nextId } = require("../data");
const {
  isNonEmptyString,
  isEmail,
  isPhone,
  sendValidationError,
} = require("../utils/validate");

const findUser = (id) => users.find((user) => user.id === Number(id));

const listUsers = (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  let result = users;

  if (isNonEmptyString(search)) {
    const query = search.toLowerCase();

    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const start = (pageNumber - 1) * pageSize;

  res.status(200).json({
    total: result.length,
    page: pageNumber,
    limit: pageSize,
    items: result.slice(start, start + pageSize),
  });
};

const getUserById = (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  res.status(200).json(user);
};

const createUser = (req, res) => {
  const { name, email, phone } = req.body || {};
  const details = [];

  if (!isNonEmptyString(name)) details.push("Поле name обязательно");
  if (!isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  const exists = users.some(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (exists) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }

  const user = {
    id: nextId("users"),
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : "",
  };

  users.push(user);

  res.status(201).json(user);
};

const updateUser = (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const { name, email, phone } = req.body || {};
  const details = [];

  if (!isNonEmptyString(name)) details.push("Поле name обязательно");
  if (!isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  const duplicate = users.some(
    (item) =>
      item.id !== user.id &&
      item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (duplicate) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }

  user.name = name.trim();
  user.email = email.trim();
  user.phone = phone ? phone.trim() : "";

  res.status(200).json(user);
};

const patchUser = (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const { name, email, phone } = req.body || {};
  const details = [];

  if (name !== undefined && !isNonEmptyString(name)) details.push("Поле name не может быть пустым");
  if (email !== undefined && !isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  if (email !== undefined) {
    const duplicate = users.some(
      (item) =>
        item.id !== user.id &&
        item.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (duplicate) {
      return res.status(409).json({ error: "Пользователь с таким email уже существует" });
    }

    user.email = email.trim();
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  res.status(200).json(user);
};

const deleteUser = (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const hasRequests = requests.some((request) => request.userId === user.id);

  if (hasRequests) {
    return res.status(409).json({
      error: "Нельзя удалить пользователя: у него есть заявки",
    });
  }

  users.splice(users.indexOf(user), 1);

  res.status(204).send();
};

const getUserRequests = (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const items = requests.filter((request) => request.userId === user.id);

  res.status(200).json({ total: items.length, items });
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUserRequests,
};
