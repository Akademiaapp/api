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

router.put("/self", function (req, res, next) {
  const { email, first_name, last_name, schoolId, type } = req.query;

  prisma.user
    .update({
      where: {
        id: req.userRecord.id,
      },
      data: {
        email: email,
        first_name: first_name,
        last_name: last_name,
        schoolId: schoolId,
        updated_at: new Date(),
        type: type,
      },
    })
    .then((data) => {
      res.json(data).status(200);
    });
});

router.post('/self/groups', function (req, res, next) {
  const { groupId } = req.query;
  prisma.user_group.create({
    data: {
      user_id: req.userRecord.id,
      group_id: groupId,
    },
  }).then((data) => {
    res.json(data).status(200);
  });
});

router.all("*", function (req, res, next) {
  res.status(404).json("Not found");
});

export default router;
