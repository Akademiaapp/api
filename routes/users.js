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
  prisma.user.findFirst({
    where: {
      id: req.user.sub,
    },
  }).then((data) => {
    res.json(data).status(200);
    return;
  });
});

export default router;
