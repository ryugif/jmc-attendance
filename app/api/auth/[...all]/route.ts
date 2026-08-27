import { auth } from "@/app/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);