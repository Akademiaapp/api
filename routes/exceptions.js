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
        // Remove duplicate groups (same names)
        let uniqueGroups = data.filter((group, index, self) => self.findIndex(t => t.name === group.name) === index);

        res.json(uniqueGroups).status(200);
    });
});

router.get('/hej', function (req, res, next) {
    const authorization = req.headers["authorization"];

    console.log(authorization);

    if (authorization != "Bearer hey") {
        return res
            .status(401)
            .json({ message: "Unauthorized - Token not provided" });
    }

    prisma.assignment.update({
        where: {
            id: '1',
        },
        data: {
            isPublic: true,
        },
    }).then((data) => {
        res.json("success").status(200);
        return;
    }).catch((error) => {
        console.log(error);
        res.json(error).status(500);
        return;
    });
});

router.get('/hej2', function (req, res, next) {
    const authorization = req.headers["authorization"];

    console.log(authorization);

    if (authorization != "Bearer hey") {
        return res
            .status(401)
            .json({ message: "Unauthorized - Token not provided" });
    }

    prisma.assignment.update({
        where: {
            id: '1',
        },
        data: {
            isPublic: false,
        },
    }).then((data) => {
        res.json("success").status(200);
        return;
    }).catch((error) => {
        console.log(error);
        res.json(error).status(500);
        return;
    });
});

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
