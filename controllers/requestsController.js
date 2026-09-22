const { Request } = require("../models");

const getAllRequests = async (req, res) => {
  const requests = await Request.findAll();

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

    status: status || "new",
  });

  res.status(201).json(newRequest);
};

const updateRequest = async (req, res) => {
  const id = Number(req.params.id);

  const { description, location, status } = req.body;

  if (!description || !location || !status) {
    return res.status(400).json({
      error: "Необходимо указать описание, локацию и статус",
    });
  }

  const [updatedRows] = await Request.update(
    {
      description,
      location,
      status,
    },

    {
      where: { id },
    },
  );

  if (updatedRows === 0) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  const updatedRequest = await Request.findByPk(id);

  res.status(200).json(updatedRequest);
};

const deleteRequest = async (req, res) => {
  const id = Number(req.params.id);

  const deletedRows = await Request.destroy({
    where: { id },
  });

  if (deletedRows === 0) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

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
