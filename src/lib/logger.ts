import pino from "pino";
import { isProduction } from "../config.js";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: isProduction
    ? undefined
    : { target: "pino/file", options: { destination: 1 } }, // stdout
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
