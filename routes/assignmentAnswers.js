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

        // Clear non public
        const publicAssignments = uniqueAssignments.filter(assignment => assignment.isPublic === true);

        // Add status to each assignment
        const assignmentsWithStatus = publicAssignments.map((assignment) => {
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

router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
  });
  
export default router;
  