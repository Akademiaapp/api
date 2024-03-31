import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users documents
router.get("/", async function (req, res, next) {
	const file_permissions = await prisma.file_permission.findMany({
		where: {
			user_id: req.user.sub,
		},
	});

	// Get the actual documents from the document permissions
	let documents = [];
	for (let file_permission of file_permissions) {
		try {
			let document = await prisma.document.findFirst({
				where: {
					id: file_permission.document_id,
				},
			});
			documents.push(document);
		} catch (error) {
			console.error("Error retrieving document:", error);
		}
	}
	// Remove duplicates
	documents.filter((document, index) => {
		return (
			documents.findIndex((document2) => {
				return document.id === document2.id;
			}) === index
		);
	});

	res.json(documents);
});

// Create document - Create
router.post("/", function (req, res, next) {
	const { name, user_id, isNote } = req.query;
	isNote = isNote === "true";
	prisma.document
		.create({
			data: {
				name: name,
				data: Buffer.from(""),
				isNote: isNote || false,
				created_at: new Date(),
				updated_at: new Date(),
			},
		})
		.then((data) => {
			// Add the user to the document
			prisma.file_permission
				.create({
					data: {
						document_id: data.id,
						user_id: user_id,
						permission: "OWNER",
					},
				})
				.then(() => {
					res.json(data).status(200);
					return;
				});
		});
});

// Get document - Read
router.get("/:id", function (req, res, next) {
	let id = req.params.id;

	prisma.document
		.findFirst({
			where: {
				id: id,
			},
		})
		.then((data) => {
			res.json(data).status(200);
			return;
		})
		.catch((error) => {
			console.error(error);
			res.status(400).json("Document not found");
			return;
		});
});

// Rename document - Update
router.put("/:id", function (req, res, next) {
	let { id } = req.params;
	const { name } = req.query;
	prisma.document
		.update({
			where: {
				id: id,
			},
			data: {
				name: name,
			},
		})
		.then((data) => {
			res.json(data).status(200);
			return;
		});
});

// Delete document - Delete
router.delete("/:id", async function (req, res, next) {
	let { id } = req.params;

	// Check if the user has access to the document
	const document = await prisma.document.findFirst({
		where: { id: id },
		include: {
			permissions: true,
		},
	});

	const permission = document.permissions.find((permission) => {
		return permission.user_id == req.user.sub;
	});

	if (!permission && permission.permission != "OWNER") {
		res
			.status(400)
			.json("Unauthorized - User does not have access to document");
		return;
	}

	prisma.document
		.delete({
			where: {
				id: id,
			},
		})
		.then((data) => {
			res.json(data).status(200);
			return;
		});
});

// Add user to document - Update
// Create a new document_permissions for a user to the document
router.put("/:id/users", async function (req, res, next) {
	let { id } = req.params;
	const { user_email } = req.query;

	// Check if the user has access to the document
	const document = await prisma.document.findFirst({
		where: { id: id },
		include: {
			permissions: true,
		},
	});

	if (!document) {
		res.status(400).json("Document not found");
		return;
	}

	const permission = document.permissions.find((permission) => {
		return permission.user_id == req.user.sub;
	});

	if (!permission && permission.permission != "OWNER") {
		res
			.status(400)
			.json("Unauthorized - User does not have access to document");
	}

	// Get user_id from user_email
	const user = await prisma.user.findFirst({
		where: { email: user_email },
	});
	if (!user) {
		res.status(400).json("User not found");
		return;
	}

	prisma.file_permission
		.upsert({
			where: {
				document_id_user_id: {
					document_id: id,
					user_id: user.id,
				},
			},
			create: {
				document_id: id,
				user_id: user.id,
				permission: "WRITE",
			},
			update: {
				permission: "WRITE",
			},
		})
		.then((data) => {
			res.json(data).status(200);
			return;
		});
});

// Get users with access to document - Read
router.get("/:id/users", async function (req, res, next) {
	let id = req.params.id;

	// Check if the user has access to the document, is the owner or has been shared the document
	const doc = await prisma.document.findFirst({
		where: { id: id },
		include: {
			permissions: true,
		},
	});

	if (!doc) {
		res.status(400).json("Document not found");
		return;
	}

	const permission = doc.permissions.find((permission) => {
		return permission.user_id == req.user.sub;
	});

	if (!permission) {
		res
			.status(400)
			.json("Unauthorized - User does not have access to document");
		return;
	}

	// Get the actual users from permission
	const users = [];
	for (const permission of doc.permissions) {
		const user = await prisma.user.findFirst({
			where: {
				id: permission.user_id,
			},
		});
		user.permission = permission.permission;
		users.push(user);
	}

	res.json(users).status(200);
	return;
});

// Remove user from document - Delete
router.delete("/:id/users", async function (req, res, next) {
	let { id } = req.params;
	const { user_email } = req.query;

	// Check if the user has access to the document
	const document = await prisma.document.findFirst({
		where: { id: id },
		include: {
			permissions: true,
		},
	});

	if (!document) {
		res.status(400).json("Document not found");
		return;
	}

	const permission = document.permissions.find((permission) => {
		return permission.user_id == req.user.sub;
	});

	if (!permission && permission.permission != "OWNER") {
		res
			.status(400)
			.json("Unauthorized - User does not have access to document");
	}

	// Get user_id from user_email
	const user = await prisma.user.findFirst({
		where: { email: user_email },
	});
	if (!user) {
		res.status(400).json("User not found");
		return;
	}

	prisma.file_permission
		.delete({
			where: {
				document_id_user_id: {
					document_id: id,
					user_id: user.id,
				},
			},
		})
		.then((data) => {
			res.json(data).status(200);
			return;
		});
});

// Catch all
router.all("*", function (req, res, next) {
	res.status(404).json("Not found");
});

export default router;
