import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";

import middleware from "./middleware.js";
import usersRouter from "./routes/users.js";
import documentsRouter from "./routes/documents.js";
import assignmentsRouter from "./routes/assignments.js";
import assignmentAnswersRouter from "./routes/assignmentAnswers.js";
import schoolsRouter from "./routes/schools.js";
import groupsRouter from "./routes/groups.js";
import exceptionsRouter from "./routes/exceptions.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prisma
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// Fix bigint issue 
BigInt.prototype.toJSON = function () {
  return this.toString(); // Simply converts bigints to strings
};

var app = express();

app.use(cors()); // Enable CORS
app.use('/public', exceptionsRouter);

app.use(middleware.verifyToken); // Apply the middleware to all routes
app.use(middleware.verifyUserExists);
app.use(middleware.verifyUserSettings);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/documents", documentsRouter);
app.use("/assignments", assignmentsRouter);
app.use("/assignmentAnswers", assignmentAnswersRouter);
app.use("/schools", schoolsRouter);
app.use("/groups", groupsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
});

export default app;
