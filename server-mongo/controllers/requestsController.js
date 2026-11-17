const mongoose = require("mongoose");
const Request = require("../models/Request");
const Operator = require("../models/Operator");

const STATUSES = Request.STATUSES;

const parsePage = (query) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);

  return { page, limit, skip: (page - 1) * limit };
};

const getAllRequests = async (req, res, next) => {
  try {
    const { search, status, tag } = req.query;
    const { page, limit, skip } = parsePage(req.query);

    const filter = {};

    if (search) {
      filter.description = { $regex: search, $options: "i" };
    }

    if (status && STATUSES.includes(status)) {
      filter.status = status;
    }

    if (tag) {
      filter.tags = tag;
    }

    const [items, total] = await Promise.all([
      Request.find(filter)
        .populate("operator", "name shift")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(filter),
    ]);

    res.status(200).json({
      total,
      page,
      limit,
      items,
    });
  } catch (err) {
    next(err);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate(
      "operator",
      "name email shift",
    );

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const { description, location, car, tags, operator } = req.body;

    const request = await Request.create({
      description,
      location,
      car,
      tags,
      operator,
      statusHistory: [{ status: "new", changedBy: "client" }],
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

const updateRequest = async (req, res, next) => {
  try {
    const request = await Request.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json({
      message: "Заявка удалена",
      deleted: request,
    });
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: "Нужны автор и текст комментария" });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    await request.addComment(author, text);

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, "comments._id": req.params.commentId },
      { $set: { "comments.$.text": text } },
      { new: true, runValidators: true },
    );

    if (!request) {
      return res.status(404).json({ error: "Заявка или комментарий не найдены" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { status, changedBy } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Статус должен быть одним из: ${STATUSES.join(", ")}`,
      });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    await request.changeStatus(status, changedBy || "operator");

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const addTag = async (req, res, next) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ error: "Нужно указать тег" });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: tag } },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const removeTag = async (req, res, next) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tag } },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          withComments: {
            $sum: { $cond: [{ $gt: [{ $size: "$comments" }, 0] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          withComments: 1,
        },
      },
    ]);

    const withOperator = await Request.countDocuments({
      operator: { $ne: null },
    });

    res.status(200).json({ byStatus: stats, withOperator });
  } catch (err) {
    next(err);
  }
};

const getRequestsByTag = async (req, res, next) => {
  try {
    const requests = await Request.findByTag(req.params.tag);

    res.status(200).json({ total: requests.length, items: requests });
  } catch (err) {
    next(err);
  }
};

const assignOperator = async (req, res, next) => {
  try {
    const { operatorId } = req.body;

    const operator = await Operator.findById(operatorId);

    if (!operator) {
      return res.status(404).json({ error: "Диспетчер не найден" });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { operator: operator._id },
      { new: true },
    ).populate("operator", "name shift");

    if (!request) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

const getOperators = async (req, res, next) => {
  try {
    const operators = await Operator.find().sort({ name: 1 });

    res.status(200).json(operators);
  } catch (err) {
    next(err);
  }
};

const createOperator = async (req, res, next) => {
  try {
    const operator = await Operator.create(req.body);

    res.status(201).json(operator);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  addComment,
  updateComment,
  deleteComment,
  changeStatus,
  addTag,
  removeTag,
  getStats,
  getRequestsByTag,
  assignOperator,
  getOperators,
  createOperator,
};
