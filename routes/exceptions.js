import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

router.get("/schools", function (req, res, next) {
    prisma.school.findMany().then((data) => {
        res.json(data).status(200);
    });
});

router.get("/schools/:id/users", function (req, res, next) {
    const id = req.params.id;
    prisma.user.findMany({
        where: {
            schoolId: id,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.get("/schools/:id/groups", function (req, res, next) {
    const id = req.params.id;
    prisma.group.findMany({
        where: {
            school_id: id,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
