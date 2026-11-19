const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    criar
} = require("../controllers/postController");

router.use(authMiddleware);
router.post("/",authMiddleware,criar);

module.exports = router;