const express = require("express");
const router = express.Router();

const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUserRequests,
} = require("../controllers/usersController");

router.get("/", listUsers);
router.get("/:id/requests", getUserRequests);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id", patchUser);
router.delete("/:id", deleteUser);

module.exports = router;
