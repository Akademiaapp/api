import { prisma } from "./app.js";

export function getDocumentType(id) {
    const type = id.split(".")[0];
    console.log("type", type, "id", id, id.split(".")[1]);
    id = id.split(".")[1];
    if (type === "document") {
        return { document: prisma.document, id: id };
    } else if (type === "assignment") {
        return { document: prisma.assignment, id: id };;
    } else if (type === "assignmentAnswer") {
        return { document: prisma.assignment_answer, id: id };;
    } else {
        return null, null;
    }
}

export function isUserSetup(user) {
    return user.is_setup === 1;
}