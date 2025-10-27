import { write } from "bun";

const color = {
  red: Bun.color('red', 'ansi-16m'),
  green: Bun.color('green', 'ansi-16m'),
  yellow: Bun.color('yellow', 'ansi-16m'),
  blue: Bun.color('blue', 'ansi-16m'),
  magenta: Bun.color('magenta', 'ansi-16m'),
  cyan: Bun.color('cyan', 'ansi-16m'),
  white: Bun.color('white', 'ansi-16m'),
  gray: Bun.color('gray', 'ansi-16m'),
  reset: Bun.color('', 'ansi-16m')
};

const log = {
  write: (msg) => {
    console.log(color.white + msg + (color.reset || ""));
  },
  error: (msg) => {
    console.log(color.red + msg + (color.reset || ""));
  },
  success: (msg) => {
    console.log(color.green + msg + (color.reset || ""));
  },
  warn: (msg) => {
    console.log(color.yellow + msg + (color.reset || ""));
  },
  info: (msg) => {
    console.log(color.gray + msg + (color.reset || ""));
  },
  debug: (msg) => {
    console.log(color.magenta + msg + (color.reset || ""));
  },
};

export { log };