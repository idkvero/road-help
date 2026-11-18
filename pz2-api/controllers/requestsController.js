const { requests, users, operators, STATUSES, nextId } = require("../data");
const {
  isNonEmptyString,
  isPositiveInt,
  oneOf,
  sendValidationError,
} = require("../utils/validate");

const findRequest = (id) => requests.find((request) => request.id === Number(id));
const findUser = (id) => users.find((user) => user.id === Number(id));
const findOperator = (id) => operators.find((operator) => operator.id === Number(id));

const expand = (request) => {
  const user = findUser(request.userId);
  const operator = request.operatorId ? findOperator(request.operatorId) : null;

  return {
    ...request,
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    operator: operator
      ? { id: operator.id, name: operator.name, shift: operator.shift }
      : null,
  };
};

const validateRelation = (details, userId, operatorId) => {
  if (userId !== undefined && !findUser(userId)) {
    details.push("Пользователь с указанным userId не найден");
  }

  if (
    operatorId !== undefined &&
    operatorId !== null &&
    !findOperator(operatorId)
  ) {
    details.push("Диспетчер с указанным operatorId не найден");
  }
};

const listRequests = (req, res) => {
  const { status, userId, operatorId, search, page = 1, limit = 10 } = req.query;

  let result = requests;

  if (isNonEmptyString(status)) {
    result = result.filter((request) => request.status === status);
  }

  if (isNonEmptyString(userId)) {
    result = result.filter((request) => request.userId === Number(userId));
  }

  if (isNonEmptyString(operatorId)) {
    result = result.filter((request) => request.operatorId === Number(operatorId));
  }

  if (isNonEmptyString(search)) {
    const query = search.toLowerCase();

    result = result.filter((request) =>
      request.description.toLowerCase().includes(query),
    );
  }

  const sorted = [...result].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const start = (pageNumber - 1) * pageSize;

  res.status(200).json({
    total: sorted.length,
    page: pageNumber,
    limit: pageSize,
    items: sorted.slice(start, start + pageSize).map(expand),
  });
};

const getRequestById = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  res.status(200).json(expand(request));
};

const createRequest = (req, res) => {
  const { description, location, status, userId, operatorId } = req.body || {};
  const details = [];

  if (!isNonEmptyString(description)) details.push("Поле description обязательно");
  if (!isNonEmptyString(location)) details.push("Поле location обязательно");

  if (userId === undefined || !isPositiveInt(userId)) {
    details.push("Поле userId обязательно и должно быть положительным числом");
  }

  if (status !== undefined && !oneOf(status, STATUSES)) {
    details.push("Поле status: допустимо new, in_progress или completed");
  }

  validateRelation(details, userId, operatorId);

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  const request = {
    id: nextId("requests"),
    description: description.trim(),
    location: location.trim(),
    status: status || "new",
    userId: Number(userId),
    operatorId: operatorId ? Number(operatorId) : null,
    createdAt: new Date().toISOString(),
  };

  requests.push(request);

  res.status(201).json(expand(request));
};

const updateRequest = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  const { description, location, status, userId, operatorId } = req.body || {};
  const details = [];

  if (!isNonEmptyString(description)) details.push("Поле description обязательно");
  if (!isNonEmptyString(location)) details.push("Поле location обязательно");

  if (!oneOf(status, STATUSES)) {
    details.push("Поле status: допустимо new, in_progress или completed");
  }

  if (userId === undefined || !isPositiveInt(userId)) {
    details.push("Поле userId обязательно и должно быть положительным числом");
  }

  validateRelation(details, userId, operatorId);

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  request.description = description.trim();
  request.location = location.trim();
  request.status = status;
  request.userId = Number(userId);
  request.operatorId = operatorId ? Number(operatorId) : null;

  res.status(200).json(expand(request));
};

const patchRequest = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  const { description, location, status, userId, operatorId } = req.body || {};
  const details = [];

  if (description !== undefined && !isNonEmptyString(description)) {
    details.push("Поле description не может быть пустым");
  }

  if (location !== undefined && !isNonEmptyString(location)) {
    details.push("Поле location не может быть пустым");
  }

  if (status !== undefined && !oneOf(status, STATUSES)) {
    details.push("Поле status: допустимо new, in_progress или completed");
  }

  if (userId !== undefined && !isPositiveInt(userId)) {
    details.push("Поле userId должно быть положительным числом");
  }

  validateRelation(details, userId, operatorId);

  if (details.length > 0) {
    return sendValidationError(res, details);
  }

  if (description !== undefined) request.description = description.trim();
  if (location !== undefined) request.location = location.trim();
  if (status !== undefined) request.status = status;
  if (userId !== undefined) request.userId = Number(userId);
  if (operatorId !== undefined) {
    request.operatorId = operatorId ? Number(operatorId) : null;
  }

  res.status(200).json(expand(request));
};

const deleteRequest = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  requests.splice(requests.indexOf(request), 1);

  res.status(204).send();
};

const changeStatus = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  const { status } = req.body || {};

  if (!oneOf(status, STATUSES)) {
    return sendValidationError(res, [
      "Поле status: допустимо new, in_progress или completed",
    ]);
  }

  request.status = status;

  res.status(200).json(expand(request));
};

const assignOperator = (req, res) => {
  const request = findRequest(req.params.id);

  if (!request) {
    return res.status(404).json({ error: "Заявка не найдена" });
  }

  const { operatorId } = req.body || {};

  if (operatorId !== null && !findOperator(operatorId)) {
    return sendValidationError(res, [
      "Диспетчер с указанным operatorId не найден",
    ]);
  }

  request.operatorId = operatorId === null ? null : Number(operatorId);

  res.status(200).json(expand(request));
};

module.exports = {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
  patchRequest,
  deleteRequest,
  changeStatus,
  assignOperator,
};
