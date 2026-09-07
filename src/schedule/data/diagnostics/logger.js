const tag = "[schedule]";

function write(level, message, details) {
  const output =
    details === undefined
      ? `${tag} ${message}`
      : `${tag} ${message} ${details}`;
  console[level](output);
}

export const logger = {
  debug: (message, details) => write("debug", message, details),
  info: (message, details) => write("info", message, details),
  warn: (message, details) => write("warn", message, details),
  error: (message, details) => write("error", message, details),
};
