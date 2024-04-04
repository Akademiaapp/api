import express from "express";
import axios from 'axios';
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
      userId: req.userRecord.id,
      groupId: groupId,
    },
  }).then((data) => {
    res.json(data).status(200);
  });
});

async function deleteFromKeycloak(userId) {
  const url = 'https://akademia-auth.arctix.dev/realms/master/protocol/openid-connect/token';

  const formData = new URLSearchParams();
  formData.append('client_id', 'admin-cli');
  formData.append('username', process.env.ADMIN_NAME);
  formData.append('password', process.env.ADMIN_PASSWORD);
  formData.append('grant_type', 'password');

  const response = await axios.post(url, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const token = response.data.access_token;

  console.log("Found token: ", token);

  const url2 = `https://akademia-auth.arctix.dev/admin/realms/akademia/users/${userId}`;

  const response2 = await axios.delete(url2, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response2.data;
} 

router.delete('/self', function (req, res, next) {
  deleteFromKeycloak(req.userRecord.id).then(() => {
    res.status(200);
  }).then(() => {
    prisma.user.delete({
      where: {
        id: req.userRecord.id,
      },
    }).then((data) => {
      res.status(200);
    });
  });
});

router.all("*", function (req, res, next) {
  res.status(404).json("Not found");
});

export default router;
