const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Необходимо указать email и пароль",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Пароль должен содержать минимум 6 символов",
      });
    }

    const existing = await User.findOne({ where: { email } });

    if (existing) {
      return res.status(409).json({
        error: "Пользователь с таким email уже существует",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: "user",
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Пользователь с таким email уже существует",
      });
    }

    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Необходимо указать email и пароль",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: "Неверный email или пароль",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({
        error: "Неверный email или пароль",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "email", "role", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({
        error: "Пользователь не найден",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
