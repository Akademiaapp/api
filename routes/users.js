import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

/* GET users listing. */
router.get("/", function (req, res, next) {
  prisma.user.findMany().then((data) => {
    res.json(data);
  });
});

router.get("/self", function (req, res, next) {
  res.status(200).json(req.userRecord);
});

router.all("*", function (req, res, next) {
  res.status(404).json("Not found");
});

export default router;
