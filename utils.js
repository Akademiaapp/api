import { prisma } from "./app";

export function getDocumentType(id) {
    const type = id.split(".")[0];
    const id = id.split(".")[1];
    if (type === "document") {
        return prisma.document, id;
    } else if (type === "assignment") {
        return prisma.assignment, id;
    } else if (type === "assignmentAnswer") {
        return prisma.assignment_answer, id;
    } else {
        return null, null;
    }
}

export function isUserSetup(user) {
    return user.is_setup === 1;
}