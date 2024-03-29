import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

/* GET users groups. */
router.get("/", async function (req, res, next) {
    console.log("Getting groups for user: ", req.userRecord);
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

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
