import env from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = env.isProduction ? LEVELS.info : LEVELS.debug;

const COLOURS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

const serialise = (value) => {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
};

const emit = (level, message, meta) => {
  if (LEVELS[level] > activeLevel) return;
  const timestamp = new Date().toISOString();

  if (env.isProduction) {
    // Structured single-line JSON so hosted log collectors can parse it.
    const payload = { timestamp, level, message };
    if (meta !== undefined) payload.meta = serialise(meta);
    const line = JSON.stringify(payload);
    if (level === 'error') process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
    return;
  }

  const prefix = `${COLOURS[level]}${timestamp} ${level.toUpperCase().padEnd(5)}${COLOURS.reset}`;
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, message, serialise(meta));
  } else {
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
};

const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
  /** morgan stream adapter */
  stream: {
    write: (message) => emit('info', message.trim()),
  },
};

export default logger;
