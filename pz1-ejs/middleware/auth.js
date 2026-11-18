const COOKIE_NAME = "roadhelp_auth";

const auth = (req, res, next) => {
  if (req.query.auth === "1") {
    res.cookie(COOKIE_NAME, "1", { httpOnly: true, maxAge: 3600000 });
  }

  if (req.query.auth === "0") {
    res.clearCookie(COOKIE_NAME);
  }

  const isAuthorized =
    req.query.auth === "1" || req.cookies[COOKIE_NAME] === "1";

  req.user = isAuthorized
    ? { name: "Диспетчер", role: "admin" }
    : { name: "Гость", role: "guest" };

  res.locals.user = req.user;

  next();
};

const requireAuth = (req, res, next) => {
  if (req.user.role === "guest") {
    return res.redirect("/login");
  }

  next();
};

module.exports = { auth, requireAuth };
