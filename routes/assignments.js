import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users assignments
router.get("/", async function (req, res, next) {
  const user_id = req.user.sub;
  
  try {
    const assignmentAnswers = await prisma.assignment_answer.findMany({
      where: {
        student_id: user_id,
      },
    });

    console.log("assignmentAnswers: ", assignmentAnswers)

    const assignmentPromises = assignmentAnswers.map(async (assignment_status) => {
      try {
        const assignment = await prisma.assignment.findFirst({
          where: {
            id: assignment_status.assignment_id,
          }
        });
        return assignment;
      } catch (error) {
        console.log("Couldn't get assignment. Something's fishy....");
        return null;
      }
    });

    const assignments = await Promise.all(assignmentPromises);

    // Remove nulls
    const filteredAssignments = assignments.filter(assignment => assignment !== null);
    // Clear duplicates
    const uniqueAssignments = filteredAssignments.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    // Add status to each assignment
    const assignmentsWithStatus = uniqueAssignments.map((assignment) => {
      const answer = assignmentAnswers.find((answer) => answer.assignment_id === assignment.id);
      return { ...assignment, status: answer.status, answer_id: answer.id };
    });

    console.log("total assignments: ", assignmentsWithStatus);
    res.json(assignmentsWithStatus).status(200);
    return;
  } catch (error) {
    console.error("Error retrieving assignments:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
});


// Create assignment - Create
router.post("/", async function (req, res, next) {
  const user_id = req.user.sub;

  try {
    // Validate that the user is a teacher
    const teacher = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (teacher == null) {
      res.status(401).json({ message: "Unauthorized - User is not a teacher" });
      return;
    } else {
      const { name, document_id, due_date, assignedGroupIds } = req.query;

      // Validate that name and document are provided
      if (name == null || document_id == null || due_date == null || assignedGroupIds == null) {
        res
          .status(400)
          .json({ message: "Bad request - Missing name, document_id, assignedGroupIds or due_date" });
        return;
      }

      // Validate that the due_date is a valid iso date
      if (!BigInt(new Date(due_date).valueOf())) {
        res.status(400).json({ message: "Bad request - Invalid due_date" });
        return;
      }

      // Validate that the document exists
      const document = await prisma.document.findFirst({
        where: {
          id: document_id,
        },
      });

      if (document == null) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      const assignment_data = await prisma.assignment.create({
        data: {
          name: name,
          assignment_document_id: document_id,
          teacher_id: user_id,
          due_date: BigInt(Date.parse(due_date).valueOf()),
        },
      });

      // Create assignment answers for all students
      const students = await prisma.user.findMany({
        where: {
          type: {
            in: ["STUDENT", "TESTER"],
          },
        },
      });

      for (const student of students) {
        await prisma.file_permission.create({
          data: {
            document_id: assignment_data.id,
            user_id: student.id,
            status: "NOT_STARTED",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }

  res.status(201).json({ message: "Assignment created" });
  return;
});

router.all("*", function (req, res, next) {
  res.status(404).json("Not found");
}); 

export default router;
