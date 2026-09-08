const requests = require("../models/requestsModel");

const getAllRequests = (req, res) => {
  res.status(200).json(requests);
};

const getRequestById = (req, res) => {
  const id = Number(req.params.id);

  const request = requests.find((request) => request.id === id);

  if (!request) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  res.status(200).json(request);
};

const createRequest = (req, res) => {
  const { description, location, status } = req.body;

  if (!description || !location) {
    return res.status(400).json({
      error: "Необходимо указать описание и локацию",
    });
  }

  const newRequest = {
    id: requests.length > 0 ? requests[requests.length - 1].id + 1 : 1,
    description,
    location,
    status: status || "new",
  };

  requests.push(newRequest);

  res.status(201).json(newRequest);
};

const updateRequest = (req, res) => {
  const id = Number(req.params.id);

  const request = requests.find((request) => request.id === id);

  if (!request) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  const { description, location, status } = req.body;

  if (!description || !location || !status) {
    return res.status(400).json({
      error: "Необходимо указать описание, локацию и статус",
    });
  }

  request.description = description;
  request.location = location;
  request.status = status;

  res.status(200).json(request);
};

const deleteRequest = (req, res) => {
  const id = Number(req.params.id);

  const index = requests.findIndex((request) => request.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Заявка не найдена",
    });
  }

  const deletedRequest = requests.splice(index, 1);

  res.status(200).json(deletedRequest[0]);
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
};
