import express from "express";
var router = express.Router();

import { prisma } from "../app.js";
import * as Y from "yjs"
import { yDocToProsemirrorJSON } from "y-prosemirror";

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

  console.log("total documents: ", documents);

  res.json(documents);
});

// Create document - Create
router.post("/", function (req, res, next) {
  const { name, user_id } = req.query;
  prisma.document
    .create({
      data: {
        name: name,
        data: Buffer.from(""),
        created_at: new Date(),
        updated_at: new Date()
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
  let { id } = req.params;
  
  // Get document type and id from name
  const documentType = id.split(".")[0];
  const documentId = id.split(".")[1];

  // Set `document` based on document type
  let document;
  if (documentType === "document") {
    document = prisma.document;
  } else if (documentType === "assignment") {
    document = prisma.assignment;
  } else if (documentType === "assignmentAnswer") {
    document = prisma.assignment_answer;
  }

  console.log(documentId);
  document
    .findFirst({
      where: {
        id: documentId,
      },
    })
    .then((data) => {
      res.json(data).status(200);
      return;
    }).catch((error) => {
      console.error(error);
      res.status(400).json('Document not found')
      return;
    });
});

// Get document json - Read
router.get("/:id/json", function (req, res, next) {
  let { id } = req.params;
  id = id.split(".")[1];
  prisma.document
    .findFirst({
      where: {
        id: id,
      },
    })
    .then((data) => {
      console.log(data);
      const ydoc = new Y.Doc()
      ydoc.applyUpdate(data.data)
      let json = yDocToProsemirrorJSON(yjsdoc);
      console.log(json);
      res.json(json).status(200);
      return;
    });
});

// Rename document - Update
router.put("/:id", function (req, res, next) {
  let { id } = req.params;
  id = id.split(".")[1];
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
  id = id.split(".")[1];

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
    res.status(400).json("Unauthorized - User does not have access to document");
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
  id = id.split(".")[1];
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
    res.status(400).json("Unauthorized - User does not have access to document");
  }

  // Get user_id from user_email
  const user = await prisma.user.findFirst({
    where: { email: user_email },
  });
  console.log("user!: ", user);
  if (!user) {
    res.status(400).json('User not found');
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
  let { id } = req.params;
  id = id.split(".")[1];
  console.log("id", id)

  // Check if the user has access to the document, is the owner or has been shared the document
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

  console.log("document", document);

  const permission = document.permissions.find((permission) => {
    return permission.user_id == req.user.sub;
  });

  console.log("permission!: ", permission)

  if (
    !permission
  ) {
    res
      .status(400)
      .json("Unauthorized - User does not have access to document");
    return;
  }

  // Get the actual users from permission
  const users = [];
  for (const permission of document.permissions) {
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

export default router;
