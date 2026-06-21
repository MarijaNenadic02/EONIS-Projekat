#!/usr/bin/env node
// One-command launcher WITH Stripe test payments.
// - ensures dependencies, database and .env exist
// - makes sure a Stripe TEST secret key is configured (asks once if missing)
// - downloads the Stripe CLI automatically on Windows if needed
// - opens the webhook tunnel, captures the signing secret, writes it to .env
// - starts the backend + frontend and opens the shop in the browser
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "server");
const clientDir = path.join(root, "client");
const envPath = path.join(serverDir, ".env");
const isWin = process.platform === "win32";
const log = (m) => console.log(`\n==== ${m} ====`);

function ensureEnvFile() {
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(serverDir, ".env.example"), envPath);
    console.log("Created server/.env from template");
  }
}
const readEnv = () => fs.readFileSync(envPath, "utf8");
function getEnv(key) {
  const m = readEnv().match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n]*)"?`, "m"));
  return m ? m[1] : "";
}
function setEnv(key, val) {
  let t = readEnv();
  const line = `${key}="${val}"`;
  if (new RegExp(`^${key}\\s*=`, "m").test(t))
    t = t.replace(new RegExp(`^${key}\\s*=.*$`, "m"), line);
  else t = t.replace(/\s*$/, "") + `\n${line}\n`;
  fs.writeFileSync(envPath, t);
}
function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
}
const have = (cmd) =>
  spawnSync(isWin ? "where" : "which", [cmd], { shell: true }).status === 0;
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, shell: true, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`"${cmd} ${args.join(" ")}" failed`);
}

async function downloadStripeWindows() {
  log("Stripe CLI not found — downloading it for Windows");
  const rel = await (
    await fetch("https://api.github.com/repos/stripe/stripe-cli/releases/latest")
  ).json();
  const asset = rel.assets.find((a) => /windows_x86_64\.zip$/i.test(a.name));
  if (!asset) throw new Error("Could not locate the Windows Stripe CLI download");
  const binDir = path.join(root, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  const zip = path.join(binDir, "stripe.zip");
  fs.writeFileSync(zip, Buffer.from(await (await fetch(asset.browser_download_url)).arrayBuffer()));
  spawnSync(
    "powershell",
    ["-NoProfile", "-Command", `Expand-Archive -Force -Path '${zip}' -DestinationPath '${binDir}'`],
    { stdio: "inherit" }
  );
  fs.rmSync(zip, { force: true });
  const exe = path.join(binDir, "stripe.exe");
  if (!fs.existsSync(exe)) throw new Error("Stripe CLI extraction failed");
  console.log("Stripe CLI ready.");
  return exe;
}

async function main() {
  ensureEnvFile();

  // Dependencies + database (first run only)
  if (!fs.existsSync(path.join(serverDir, "node_modules"))) {
    log("Installing backend dependencies");
    run("npm", ["install"], serverDir);
    run("npx", ["prisma", "generate"], serverDir);
    run("npx", ["prisma", "migrate", "deploy"], serverDir);
    run("npm", ["run", "seed"], serverDir);
  }
  if (!fs.existsSync(path.join(clientDir, "node_modules"))) {
    log("Installing frontend dependencies");
    run("npm", ["install"], clientDir);
  }

  // Stripe TEST secret key
  let sk = getEnv("STRIPE_SECRET_KEY");
  if (!sk.startsWith("sk_test_")) {
    console.log("\nThis app needs a Stripe TEST secret key (it starts with sk_test_).");
    console.log("Ask the project owner to send you theirs — it is a test key, no real money.\n");
    sk = await ask("Paste the Stripe TEST secret key: ");
    if (!sk.startsWith("sk_test_")) {
      console.log("That is not a test key (must start with sk_test_). Stopping.");
      process.exit(1);
    }
    setEnv("STRIPE_SECRET_KEY", sk);
    console.log("Saved to server/.env");
  }

  // Stripe CLI
  let stripeCmd = "stripe";
  if (!have("stripe")) {
    const localExe = path.join(root, "bin", isWin ? "stripe.exe" : "stripe");
    if (fs.existsSync(localExe)) stripeCmd = localExe;
    else if (isWin) stripeCmd = await downloadStripeWindows();
    else {
      console.log("\nStripe CLI not found. Install it:  brew install stripe/stripe-cli/stripe");
      process.exit(1);
    }
  }

  // Webhook tunnel + capture signing secret
  log("Opening Stripe webhook tunnel");
  const listen = spawn(
    stripeCmd,
    ["listen", "--api-key", sk, "--forward-to", "localhost:4000/api/webhook"],
    { shell: true }
  );
  const whsec = await new Promise((resolve, reject) => {
    let done = false;
    const onData = (buf) => {
      const s = buf.toString();
      process.stdout.write("[stripe] " + s);
      const m = s.match(/whsec_[A-Za-z0-9]+/);
      if (m && !done) { done = true; resolve(m[0]); }
    };
    listen.stdout.on("data", onData);
    listen.stderr.on("data", onData);
    listen.on("exit", () => !done && reject(new Error("Stripe listener exited early")));
    setTimeout(() => !done && reject(new Error("Timed out waiting for the webhook secret")), 30000);
  });
  setEnv("STRIPE_WEBHOOK_SECRET", whsec);
  console.log("Webhook signing secret saved to server/.env");

  // Start servers
  log("Starting backend + frontend");
  const be = spawn("npm", ["run", "dev"], { cwd: serverDir, shell: true, stdio: "inherit" });
  const fe = spawn("npm", ["run", "dev"], { cwd: clientDir, shell: true, stdio: "inherit" });

  setTimeout(() => {
    const opener = isWin ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    spawn(opener, ["http://localhost:5173"], { shell: true });
  }, 9000);

  console.log("\nReady — the shop opens at http://localhost:5173");
  console.log("Pay with test card 4242 4242 4242 4242, any future date, any CVC.");
  console.log("Keep this window open while testing; press Ctrl+C to stop everything.\n");

  const stop = () => { [listen, be, fe].forEach((p) => p && p.kill()); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error("\n[ERROR]", e.message);
  process.exit(1);
});
