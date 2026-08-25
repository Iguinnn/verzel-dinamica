import { spawn } from "node:child_process";

const processes = [
  spawn("npm", ["run", "dev:api"], { stdio: "inherit", shell: true }),
  spawn("npm", ["run", "dev:web"], { stdio: "inherit", shell: true }),
];

function stopProcesses(signal) {
  for (const childProcess of processes) {
    childProcess.kill(signal);
  }
}

process.on("SIGINT", () => stopProcesses("SIGINT"));
process.on("SIGTERM", () => stopProcesses("SIGTERM"));

const exitCode = await Promise.race(
  processes.map(
    (childProcess) =>
      new Promise((resolve) => {
        childProcess.on("exit", (code) => resolve(code ?? 1));
      }),
  ),
);

stopProcesses("SIGTERM");
process.exitCode = exitCode;
