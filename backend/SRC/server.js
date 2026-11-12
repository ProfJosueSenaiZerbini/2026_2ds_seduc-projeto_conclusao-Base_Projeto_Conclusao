const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes.routes");
const postRoutes = require("./routes/posts.Routes");
const adminRoutes = require("./routes/admin.Routes");
const userRoutes = require("./routes/user.Routes");
const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
    res.json({
        mensagem: "API funcionando"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin/posts", adminRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`servidor funcionando em http://localhost:${PORT}`);
});
