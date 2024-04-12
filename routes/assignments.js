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

// Deploy assignment - Update
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
			res
				.status(401)
				.json({ message: "Unauthorized - Assignment not owned by user" });
			return;
		}

		// Validate that the assignment is not already public
		if (assignment.isPublic === true) {
			res
				.status(400)
				.json({ message: "Bad request - Assignment already deployed" });
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
		const students_groups = await prisma.user_group.findMany({
			where: {
				groupId: {
					in: assigned_groups,
				},
			},
		});

		students_ids = [
			...students_ids.map((g) => g.userId),
			...deployed_assignment.asigned_users_ids,
		];
		// Filter out duplicates
		const unique_students_ids = students_ids.filter(
			(v, i, a) => a.findIndex((t) => t === v) === i
		);

		const assignment_answers_promises = unique_students_ids.map(
			async (student_id) => {
				try {
					const assignment_answer = await prisma.assignment_answer.create({
						data: {
							assignment_id: assignment_id,
							student_id: student_id,
							status: "NOT_STARTED",
						},
					});
					return assignment_answer;
				} catch (error) {
					console.error("Error creating assignment answer: ", error);
					return null;
				}
			}
		);

		const assignment_answers = await Promise.all(assignment_answers_promises);

		res.status(200).json(assignment_answers);
		return;
	}
});

// Update assignment - Update
router.put("/:id", async function (req, res, next) {
	const user_id = req.user.sub;
	const assignment_id = req.params.id;
	let { asigned_groups_ids, name, due_date, asigned_users_ids } = req.query;

	if (asigned_groups_ids) {
		try {
			asigned_groups_ids = asigned_groups_ids.split(",");
			if (asigned_groups_ids.length === 0 || asigned_groups_ids === "") {
				res
					.status(400)
					.json({ message: "Bad request - Invalid asigned_groups_ids" });
				return;
			}
		} catch (error) {
			res
				.status(400)
				.json({ message: "Bad request - Invalid asigned_groups_ids" });
			return;
		}
	}
	if (asigned_users_ids) {
		try {
			asigned_users_ids = asigned_users_ids.split(",");
			if (asigned_users_ids.length === 0 || asigned_users_ids === "") {
				res
					.status(400)
					.json({ message: "Bad request - Invalid asigned_users_ids" });
				return;
			}
		} catch (error) {
			res
				.status(400)
				.json({ message: "Bad request - Invalid asigned_users_ids" });
			return;
		}
	}

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
			res
				.status(401)
				.json({ message: "Unauthorized - Assignment not owned by user" });
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
				name: name,
				due_date: due_date,
				asigned_users_ids: asigned_users_ids,
			},
		});

		res.status(200).json(updated_assignment);
		return;
	}
});

// Get assignment by id
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
			res
				.status(401)
				.json({ message: "Unauthorized - Assignment not owned by user" });
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

// Get assignment by id
router.get("/:id", async function (req, res, next) {
	const user_id = req.user.sub;
	const assignment_id = req.params.id;

	// Validate that the user is a teacher
	const teacher = await prisma.user.findFirst({
		where: {
			id: user_id,
		},
	});

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

	res.status(200).json(assignment);
	return;
});

// Get submitted assignment answers
router.get("/:id/submitted", async function (req, res, next) {
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
			res
				.status(401)
				.json({ message: "Unauthorized - Assignment not owned by user" });
			return;
		}

		const assignment_answers = await prisma.assignment_answer.findMany({
			where: {
				assignment_id: assignment_id,
				status: {
					in: ["SUBMITTED", "GRADED"],
				},
			},
		});

		// Attach student data
		const assignment_answers_with_students = await Promise.all(
			assignment_answers.map(async (assignment_answer) => {
				const student = await prisma.user.findFirst({
					where: {
						id: assignment_answer.student_id,
					},
				});

				return {
					...assignment_answer,
					student,
				};
			})
		);

		res.status(200).json(assignment_answers_with_students);
		return;
	}
});

// Catch all
router.all("*", function (req, res, next) {
	res.status(404).json("Not found");
});

export default router;
