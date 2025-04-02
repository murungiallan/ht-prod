import { Router } from "express";
import authenticate from "../middleware/auth.js";

const router = Router();

router.get("/protected", authenticate, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

export default router;