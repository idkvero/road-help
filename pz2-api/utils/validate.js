const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isPhone = (value) =>
  typeof value === "string" && /^[+0-9()\-\s]{5,20}$/.test(value.trim());

const isPositiveInt = (value) => {
  const number = Number(value);

  return Number.isInteger(number) && number > 0;
};

const oneOf = (value, list) => list.includes(value);

const sendValidationError = (res, details) =>
  res.status(400).json({
    error: "Ошибка валидации данных",
    details,
  });

module.exports = {
  isNonEmptyString,
  isEmail,
  isPhone,
  isPositiveInt,
  oneOf,
  sendValidationError,
};
