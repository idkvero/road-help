const { Op } = require("sequelize");
const { Request } = require("../models");

const STATUSES = ["new", "in_progress", "completed"];

const isAdmin = (user) => user.role === "admin";

const getAllRequests = async (req, res) => {
  const { search } = req.query;

  const where = {};

  if (!isAdmin(req.user)) {
    where.userId = req.user.id;
  }

  if (search) {
    where.description = { [Op.iLike]: `%${search}%` };
  }

  const requests = await Request.findAll({
    where,
    order: [["id", "ASC"]],
  });

  res.status(200).json(requests);
};

const getRequestById = async (req, res) => {
  const id = Number(req.params.id);

  const request = await Request.findByPk(id);

  if (!request) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  if (!isAdmin(req.user) && request.userId !== req.user.id) {
    return res.status(403).json({
      error: "Это заявка другого пользователя",
    });
  }

  res.status(200).json(request);
};

const createRequest = async (req, res) => {
  const { description, location, status } = req.body;

  if (!description || !location) {
    return res.status(400).json({
      error: "Необходимо указать описание и локацию",
    });
  }

  const newRequest = await Request.create({
    description,
    location,
    status: isAdmin(req.user) && STATUSES.includes(status) ? status : "new",
    userId: req.user.id,
  });

  res.status(201).json(newRequest);
};

const updateRequest = async (req, res) => {
  const id = Number(req.params.id);

  const { description, location, status } = req.body;

  if (!description || !location) {
    return res.status(400).json({
      error: "Необходимо указать описание и локацию",
    });
  }

  const request = await Request.findByPk(id);

  if (!request) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  if (!isAdmin(req.user) && request.userId !== req.user.id) {
    return res.status(403).json({
      error: "Это заявка другого пользователя",
    });
  }

  const nextStatus =
    isAdmin(req.user) && STATUSES.includes(status) ? status : request.status;

  await request.update({
    description,
    location,
    status: nextStatus,
  });

  res.status(200).json(request);
};

const deleteRequest = async (req, res) => {
  const id = Number(req.params.id);

  const request = await Request.findByPk(id);

  if (!request) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  if (!isAdmin(req.user) && request.userId !== req.user.id) {
    return res.status(403).json({
      error: "Это заявка другого пользователя",
    });
  }

  await request.destroy();

  res.status(200).json({
    message: "Заявка удалена",
  });
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
};
