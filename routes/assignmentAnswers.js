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

        res.json(assignmentsWithStatus).status(200);
        return;
    } catch (error) {
        console.error("Error retrieving assignments:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
});

// Get assignment by id
router.get("/:id", async function (req, res, next) {
    const user_id = req.user.sub;
    const assignment_id = req.params.id;

    try {
        const assignmentAnswer = await prisma.assignment_answer.findFirst({
            where: {
                student_id: user_id,
                id: assignment_id,
            },
        });

        if (!assignmentAnswer) {
        res.status(404).json({ error: "Assignment not found" });
        return;
        }

        const assignment = await prisma.assignment.findFirst({
        where: {
            id: assignment_id,
        },
        });

        if (!assignment) {
        res.status(404).json({ error: "Assignment not found" });
        return;
        }

        res.json({ ...assignment, status: assignmentAnswer.status, answer_id: assignmentAnswer.id }).status(200);
        return;
    } catch (error) {
        console.error("Error retrieving assignment:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
});

// Update assignment status
router.put("/:id", async function (req, res, next) {
    const user_id = req.user.sub;
    const assignment_id = req.params.id;
    const { status } = req.query;

    try {
        const assignmentAnswer = await prisma.assignment_answer.findFirst({
            where: {
                student_id: user_id,
                assignment_id: assignment_id,
            },
        });

        if (!assignmentAnswer) {
            res.status(404).json({ error: "Assignment not found" });
        return;
        }

        const updatedAssignmentAnswer = await prisma.assignment_answer.update({
            where: {
                id: assignmentAnswer.id,
            },
            data: {
                status: status,
            },
        });

        res.json(updatedAssignmentAnswer).status(200);
        return;
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
});

// Delete assignment
router.delete("/:id", async function (req, res, next) {
    const user_id = req.user.sub;
    const assignment_id = req.params.id;

    try {
        const assignmentAnswer = await prisma.assignment_answer.findFirst({
            where: {
                student_id: user_id,
                assignment_id: assignment_id,
            },
        });

        if (!assignmentAnswer) {
        res.status(404).json({ error: "Assignment not found" });
        return;
        }

        await prisma.assignment_answer.delete({
            where: {
                id: assignmentAnswer.id,
            },
        });

        res.status(204).send();
        return;
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
});

// Catch all
router.all("*", function (req, res, next) {
    res.status(404).json("Not found");
});

export default router;
  