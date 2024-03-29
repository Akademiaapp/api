import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all assignments
router.get("/", async function (req, res, next) {
  const user_id = req.user.sub;
  
  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      teacher_id: user_id,
    },
  });

  res.status(200).json(assignments);
  return;
});


// Create assignment - Create
router.post("/", async function (req, res, next) {
  const user_id = req.user.sub;

  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  } else {
    const { name, due_date } = req.query;

    // Validate that name and document are provided
    if (name == null || due_date == null) {
      res
        .status(400)
        .json({ message: "Bad request - Missing name or due_date" });
      return;
    }

    // Validate that the due_date is a valid iso date
    if (!new Date(due_date).valueOf()) {
      res.status(400).json({ message: "Bad request - Invalid due_date" });
      return;
    }

    const assignment_data = await prisma.assignment.create({
      data: {
        name: name,
        isPublic: false,
        teacher_id: user_id,
        due_date: new Date(due_date),
        updated_at: new Date(),
        created_at: new Date(),
      },
    });

    res.status(201).json(assignment_data);
    return;
  }
});

router.post("/:id/deploy", async function (req, res, next) {
  const user_id = req.user.sub;
  const assignment_id = req.params.id;

  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  } else {
    // Validate that the assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignment_id,
      },
    });

    if (assignment == null) {
      res.status(404).json({ message: "Not found - Assignment not found" });
      return;
    }

    // Validate that the assignment is owned by the teacher
    if (assignment.teacher_id !== user_id) {
      res.status(401).json({ message: "Unauthorized - Assignment not owned by user" });
      return;
    }

    // Validate that the assignment is not already public
    if (assignment.isPublic === true) {
      res.status(400).json({ message: "Bad request - Assignment already deployed" });
      return;
    }

    // Make the assignment public
    const deployed_assignment = await prisma.assignment.update({
      where: {
        id: assignment_id,
      },
      data: {
        isPublic: true,
      },
    });

    // Create assignment answers for all students in assigned groups
    const assigned_groups = deployed_assignment.asigned_groups_ids;
    const students = await prisma.user_group.findMany({
      where: {
        groupId: {
          in: assigned_groups,
        },
      },
    });

    // Filter out duplicates
    const unique_students = students.filter((v, i, a) => a.findIndex(t => (t.user_id === v.user_id)) === i);

    const assignment_answers_promises = unique_students.map(async (student) => {
      try {
        const assignment_answer = await prisma.assignment_answer.create({
          data: {
            assignment_id: assignment_id,
            student_id: student.userId,
            status: "NOT_STARTED",
          },
        });
        return assignment_answer;
      } catch (error) {
        console.error("Error creating assignment answer: ", error);
        return null;
      }
    });

    const assignment_answers = await Promise.all(assignment_answers_promises);

    res.status(200).json(assignment_answers);
    return;
  }
});

router.put("/:id", async function (req, res, next) {
  const user_id = req.user.sub;
  const assignment_id = req.params.id;
  let { asigned_groups_ids, name } = req.query;
  asigned_groups_ids = JSON.parse(asigned_groups_ids);

  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  } else {
    // Validate that the assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignment_id,
      },
    });

    if (assignment == null) {
      res.status(404).json({ message: "Not found - Assignment not found" });
      return;
    }

    // Validate that the assignment is owned by the teacher
    if (assignment.teacher_id !== user_id) {
      res.status(401).json({ message: "Unauthorized - Assignment not owned by user" });
      return;
    }

    // Update the assignment
    const updated_assignment = await prisma.assignment.update({
      where: {
        id: assignment_id,
      },
      data: {
        updated_at: new Date(),
        asigned_groups_ids: asigned_groups_ids,
        name: name
      },
    });

    res.status(200).json(updated_assignment);
    return;
  }
});

router.delete("/:id", async function (req, res, next) {
  const user_id = req.user.sub;
  const assignment_id = req.params.id;

  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  } else {
    // Validate that the assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignment_id,
      },
    });

    if (assignment == null) {
      res.status(404).json({ message: "Not found - Assignment not found" });
      return;
    }

    // Validate that the assignment is owned by the teacher
    if (assignment.teacher_id !== user_id) {
      res.status(401).json({ message: "Unauthorized - Assignment not owned by user" });
      return;
    }

    // Delete the assignment
    const deleted_assignment = await prisma.assignment.delete({
      where: {
        id: assignment_id,
      },
    });

    res.status(200).json(deleted_assignment);
    return;
  }
});

router.get("/:id", async function (req, res, next) {
  const user_id = req.user.sub;
  const assignment_id = req.params.id;

  // Validate that the user is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: user_id,
    },
  });

  if (teacher.type !== "TEACHER" && teacher.type !== "TESTER") {
    res.status(401).json({ message: "Unauthorized - User is not a teacher" });
    return;
  } else {
    // Validate that the assignment exists
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignment_id,
      },
    });

    if (assignment == null) {
      res.status(404).json({ message: "Not found - Assignment not found" });
      return;
    }

    // Validate that the assignment is owned by the teacher
    if (assignment.teacher_id !== user_id) {
      res.status(401).json({ message: "Unauthorized - Assignment not owned by user" });
      return;
    }

    res.status(200).json(assignment);
    return;
  }
});

router.all("*", function (req, res, next) {
  res.status(404).json("Not found");
});

export default router;
