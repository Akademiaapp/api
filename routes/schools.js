import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

/* GET users groups. */
router.get("/", function (req, res, next) {
    req.userRecord.user_group().then((data) => {
        res.json(data);
    });
});

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});  

export default router;
