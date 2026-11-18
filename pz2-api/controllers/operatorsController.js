const { operators, requests, SHIFTS, nextId } = require("../data");
const {
  isNonEmptyString,
  isEmail,
  isPhone,
  oneOf,
  sendValidationError,
} = require("../utils/validate");

const findOperator = (id) => operators.find((operator) => operator.id === Number(id));

const listOperators = (req, res) => {
  const { shift, page = 1, limit = 10 } = req.query;

  let result = operators;

  if (isNonEmptyString(shift)) {
    result = result.filter((operator) => operator.shift === shift);
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

const getOperatorById = (req, res) => {
  const operator = findOperator(req.params.id);

  if (!operator) {
    return res.status(404).json({ error: "Диспетчер не найден" });
  }

  res.status(200).json(operator);
};

const createOperator = (req, res) => {
  const { name, email, phone, shift } = req.body || {};
  const details = [];

  if (!isNonEmptyString(name)) details.push("Поле name обязательно");
  if (!isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");
  if (shift !== undefined && !oneOf(shift, SHIFTS)) details.push("Поле shift: допустимо day или night");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  const exists = operators.some(
    (operator) => operator.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (exists) {
    return res.status(409).json({ error: "Диспетчер с таким email уже существует" });
  }

  const operator = {
    id: nextId("operators"),
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : "",
    shift: shift || "day",
  };

  operators.push(operator);

  res.status(201).json(operator);
};

const updateOperator = (req, res) => {
  const operator = findOperator(req.params.id);

  if (!operator) {
    return res.status(404).json({ error: "Диспетчер не найден" });
  }

  const { name, email, phone, shift } = req.body || {};
  const details = [];

  if (!isNonEmptyString(name)) details.push("Поле name обязательно");
  if (!isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");
  if (shift !== undefined && !oneOf(shift, SHIFTS)) details.push("Поле shift: допустимо day или night");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  const duplicate = operators.some(
    (item) =>
      item.id !== operator.id &&
      item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (duplicate) {
    return res.status(409).json({ error: "Диспетчер с таким email уже существует" });
  }

  operator.name = name.trim();
  operator.email = email.trim();
  operator.phone = phone ? phone.trim() : "";
  operator.shift = shift || operator.shift;

  res.status(200).json(operator);
};

const patchOperator = (req, res) => {
  const operator = findOperator(req.params.id);

  if (!operator) {
    return res.status(404).json({ error: "Диспетчер не найден" });
  }

  const { name, email, phone, shift } = req.body || {};
  const details = [];

  if (name !== undefined && !isNonEmptyString(name)) details.push("Поле name не может быть пустым");
  if (email !== undefined && !isEmail(email)) details.push("Поле email должно быть корректным адресом");
  if (phone !== undefined && !isPhone(phone)) details.push("Поле phone имеет неверный формат");
  if (shift !== undefined && !oneOf(shift, SHIFTS)) details.push("Поле shift: допустимо day или night");

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  if (email !== undefined) {
    const duplicate = operators.some(
      (item) =>
        item.id !== operator.id &&
        item.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (duplicate) {
      return res.status(409).json({ error: "Диспетчер с таким email уже существует" });
    }

    operator.email = email.trim();
  }

  if (name !== undefined) operator.name = name.trim();
  if (phone !== undefined) operator.phone = phone.trim();
  if (shift !== undefined) operator.shift = shift;

  res.status(200).json(operator);
};

const deleteOperator = (req, res) => {
  const operator = findOperator(req.params.id);

  if (!operator) {
    return res.status(404).json({ error: "Диспетчер не найден" });
  }

  const hasRequests = requests.some(
    (request) => request.operatorId === operator.id,
  );

  if (hasRequests) {
    return res.status(409).json({
      error: "Нельзя удалить диспетчера: за ним закреплены заявки",
    });
  }

  operators.splice(operators.indexOf(operator), 1);

  res.status(204).send();
};

const getOperatorRequests = (req, res) => {
  const operator = findOperator(req.params.id);

  if (!operator) {
    return res.status(404).json({ error: "Диспетчер не найден" });
  }

  const items = requests.filter((request) => request.operatorId === operator.id);

  res.status(200).json({ total: items.length, items });
};

module.exports = {
  listOperators,
  getOperatorById,
  createOperator,
  updateOperator,
  patchOperator,
  deleteOperator,
  getOperatorRequests,
};
