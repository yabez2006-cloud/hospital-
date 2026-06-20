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

function spawnCommand(command, args) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", command, ...args], {
      stdio: "inherit",
    });
  }

  return spawn(command, args, {
    stdio: "inherit",
  });
}

async function main() {
  const children = [];

  const backendRunning = await isPortOpen(5000);
  if (!backendRunning) {
    children.push(spawnCommand(process.platform === "win32" ? "npm.cmd" : "npm", ["--prefix", "backend", "run", "dev"]));
  } else {
    console.log("Backend already running on port 5000.");
  }

  const frontendPorts = [5173, 5174, 5175];
  const frontendRunning = (await Promise.all(frontendPorts.map(isPortOpen))).some(Boolean);
  if (!frontendRunning) {
    children.push(spawnCommand(process.platform === "win32" ? "npm.cmd" : "npm", ["--prefix", "frontend", "run", "dev"]));
  } else {
    console.log("Frontend already running on a Vite port.");
  }

  if (children.length === 0) {
    console.log("Both frontend and backend are already running.");
    return;
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
