import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

/* GET users groups. */
router.get("/", async function (req, res, next) {
    let groups = await prisma.group.findMany({
        where: {
            id: {
                in: req.userRecord.user_group.map((group) => group.groupId),
            },
        },
    });
    res.status(200).json(groups);
});

router.post("/", function (req, res, next) {
    const { name, schoolId } = req.query;
    prisma.group
        .create({
            data: {
                name: name,
                school_id: schoolId,
            },
        })
        .then((data) => {
            res.json(data).status(200);
            return;
        });
});

router.put("/:id", function (req, res, next) {
    const id = req.params.id;
    const { name } = req.query;
    prisma.group
        .update({
            where: {
                id: id,
            },
            data: {
                name: name,
            },
        })
        .then((data) => {
            res.json(data).status(200);
            return;
        });
});

router.delete("/:id", function (req, res, next) {
    const id = req.params.id;
    prisma.group
        .delete({
            where: {
                id: id,
            },
        })
        .then((data) => {
            res.json(data).status(200);
            return;
        });
});

router.get("/:id/users", function (req, res, next) {
    const id = req.params.id;
    prisma.user_group
        .findMany({
            where: {
                groupId: id,
            },
        })
        .then((data) => {
            res.json(data).status(200);
        });
});

router.get("/:id", function (req, res, next) {
    const id = req.params.id;
    prisma.group
        .findUnique({
            where: {
                id: id,
            },
        })
        .then((data) => {
            res.json(data).status(200);
        });
});

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
