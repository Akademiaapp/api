import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

router.get("/", function (req, res, next) {
    prisma.school.findMany().then((data) => {
        res.json(data).status(200);
    });
});

router.get("/:id", function (req, res, next) {
    const id = req.params.id;
    prisma.school.findUnique({
        where: {
            id: id,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.get("/:id/users", function (req, res, next) {
    const id = req.params.id;
    prisma.user.findMany({
        where: {
            school_id: id,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.get("/:id/groups", function (req, res, next) {
    const id = req.params.id;
    prisma.group.findMany({
        where: {
            school_id: id,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.post("/", function (req, res, next) {
    const { name } = req.query;
    prisma.school.create({
        data: {
            name: name,
            address: "",
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.put("/:id", function (req, res, next) {
    const id = req.params.id;
    const { name, address } = req.query;
    prisma.school.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            address: address,
        },
    }).then((data) => {
        res.json(data).status(200);
    });
});

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
