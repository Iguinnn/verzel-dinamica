import { spawn } from "node:child_process";

const processes = [
  spawn("npm", ["run", "dev:api"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev:web"], { stdio: "inherit", shell: true }),
];

let requestedSignal;

function stopProcesses(signal) {
  if (requestedSignal) {
    return;
  }

  requestedSignal = signal;

  for (const childProcess of processes) {
    childProcess.kill(signal);
  }
}

process.on("SIGINT", () => stopProcesses("SIGINT"));
process.on("SIGTERM", () => stopProcesses("SIGTERM"));

const exits = processes.map(
  (childProcess) =>
    new Promise((resolve) => {
      childProcess.on("exit", (code) => resolve(code ?? 1));
    }),
);

const exitCode = await Promise.race(exits);

if (!requestedSignal) {
  stopProcesses("SIGTERM");
}

await Promise.all(exits);
process.exitCode = requestedSignal === "SIGINT" ? 0 : exitCode;
