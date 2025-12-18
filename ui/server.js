#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const boardPath = path.join(projectRoot, "board-config.json");
const publicDir = path.join(__dirname, "public");
const idrisExe =
  "/home/perorin/.local/state/pack/install/0e9b01d0400593fa99b320c56f6e77406a4eb968/idris2/bin/idris2";
const coverageExe = path.join(
  projectRoot,
  "..",
  "idris2-coverage",
  "build",
  "exec",
  "idris2-cov"
);

let lastCoverage = null;
let lastAppOutput = "";

function runCommand(command, args = [], cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${command} exited with code ${code}\n${stdout}\n${stderr}`
          )
        );
      }
    });
  });
}

function readBoard() {
  const raw = fs.readFileSync(boardPath, "utf8");
  return JSON.parse(raw);
}

async function applyBoard(tasks) {
  fs.writeFileSync(
    boardPath,
    JSON.stringify({ tasks }, null, 2),
    "utf8"
  );
  await runCommand("node", ["scripts/generate-board.js"]);
  await runCommand(idrisExe, ["--build", "idris2-sample.ipkg"]);
  const appResult = await runCommand("./build/exec/idris2-sample");
  lastAppOutput = appResult.stdout.trim();
  const coverageResult = await runCommand(coverageExe, [
    "--json",
    "--top",
    "5",
    ".",
  ]);
  const jsonStart = coverageResult.stdout.indexOf("{");
  if (jsonStart === -1) {
    throw new Error("Coverage command did not output JSON:\n" + coverageResult.stdout);
  }
  const jsonText = coverageResult.stdout.slice(jsonStart);
  lastCoverage = JSON.parse(jsonText);
  return { appOutput: lastAppOutput, coverage: lastCoverage };
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(publicDir, urlPath);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}

function handleApi(req, res) {
  if (req.method === "GET" && req.url.startsWith("/api/board")) {
    const body = {
      ...readBoard(),
      lastCoverage,
      lastAppOutput,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/api/board")) {
    let data = "";
    req.on("data", (chunk) => (data += chunk.toString()));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(data);
        if (!payload.tasks) {
          throw new Error("tasks array is required");
        }
        const result = await applyBoard(payload.tasks);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(err.message);
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("API endpoint not found");
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

const port = process.env.PORT || 3338;
server.listen(port, () => {
  console.log(`Task board UI running at http://localhost:${port}`);
});
