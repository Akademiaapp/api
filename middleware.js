import express from "express";
var router = express.Router();
import axios from "axios";
import { logger, prisma } from "./app.js";

// Middleware to verify JWT
const verifyToken = async (req, res, next) => {
  // Get the bearer token
  const authorization = req.headers["authorization"];

  if (!authorization) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Token not provided" });
  }

  // Verify and decode the token
  axios.get('https://auth.akademia.cc/realms/akademia/protocol/openid-connect/userinfo', {
    headers: {
      'Authorization': authorization
    }
  }).then(response => {
    // Attach user information to the request for further processing
    req.user = response.data;

    // Move to the next middleware or route handler
    next();
  }).catch(error => {
    console.error("Token verification failed:", error.message);
    return res
      .status(401)
      .json({ message: "Unauthorized - Token verification failed" });
  });
};

const verifyUserExists = async (req, res, next) => {
  // Get the user information from the request
  const user = req.user;

  // log the user
  logger.info("User: ", user);

  // Find or create the user in the database
  const userRecord = await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      id: user.sub,
      first_name: user.given_name,
      last_name: user.family_name,
      email: user.email,
      created_at: new Date(),
      updated_at: new Date(),
    }
  });

  // Attach the user record to the request for further processing
  req.userRecord = userRecord;

  // Log the user record
  console.log("User record:", userRecord);

  // Move to the next middleware or route handler
  next();
};


/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} given_name
 * @property {string} family_name
 * @property {string} email
 * @property {Date} created_at
 * @property {Date} updated_at
 * @property {string} schoolId
 */

const verifyUserSettings = async (req, res, next) => {
  /** @type {User} */
  const user = req.user;

  // Find the school of the user
  const school = await prisma.school.findFirst({
    where: {
      id: user.schoolId
    }
  });

  console.log("School:", school);

  // Move to the next middleware or route handler
  next();
};

const verifyAdmin = async (req, res, next) => {
  // Get the user information from the request
  const user = req.user;

  // Check if the user is an admin
  // temporarily hardcoded
  if (user.email !== "jonathan@bangert.dk") {
    return res
      .status(403)
      .json({ message: "Forbidden - Admin access required" });
  }

  // Move to the next middleware or route handler
  next();
}

export default { verifyToken, verifyUserExists, verifyUserSettings, verifyAdmin };