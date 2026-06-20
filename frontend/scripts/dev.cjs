const net = require("net");
const { spawn } = require("child_process");

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });

    socket.setTimeout(400, () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => resolve(false));
  });
}

function spawnCommand(command, args, cwd) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", command, ...args], {
      cwd,
      stdio: "inherit",
    });
  }

  return spawn(command, args, {
    cwd,
    stdio: "inherit",
  });
}

async function main() {
  const children = [];
  const rootDir = require("path").resolve(__dirname, "..");
  const backendDir = require("path").resolve(rootDir, "..", "backend");

  const backendRunning = await isPortOpen(5000);
  if (!backendRunning) {
    children.push(
      spawnCommand(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], backendDir)
    );
  } else {
    console.log("Backend already running on port 5000.");
  }

  const frontendPorts = [5173, 5174, 5175];
  const frontendRunning = (await Promise.all(frontendPorts.map(isPortOpen))).some(Boolean);
  if (!frontendRunning) {
    children.push(
      spawnCommand(process.platform === "win32" ? "npm.cmd" : "npm", ["exec", "vite", "--", "--host"], process.cwd())
    );
  } else {
    console.log("Frontend already running on a Vite port.");
  }

  function shutdown() {
    for (const child of children) {
      child.kill();
    }
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});