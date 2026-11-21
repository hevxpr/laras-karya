import { isUuid } from "@/lib/is-uuid";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const LEARNING_PATH = "/learning-path";

export const loginTo = (next) => `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;

export const learningPathHref = (jobId) =>
  isUuid(jobId) ? `${LEARNING_PATH}?job=${jobId}` : LEARNING_PATH;