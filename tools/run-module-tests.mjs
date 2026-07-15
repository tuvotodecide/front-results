import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const moduleMap = JSON.parse(readFileSync(join(__dirname, "test-module-map.json"), "utf8"));
const technology = process.argv[2];
const moduleName = process.argv[3];
const extraArgs = process.argv.slice(4);

const normalize = (file) => file.replaceAll("\\", "/");

function walk(dir, pattern) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath, pattern));
      continue;
    }
    const relative = normalize(fullPath.slice(rootDir.length + 1));
    if (pattern.test(relative)) files.push(relative);
  }
  return files;
}

function configuredFiles(kind, includeManual = true) {
  return Object.values(moduleMap[kind] ?? {}).flatMap((entry) => [
    ...(entry.files ?? []),
    ...(includeManual ? entry.manualFiles ?? [] : []),
  ]);
}

function checkKind(kind, discovered) {
  const files = configuredFiles(kind);
  const duplicates = files.filter((file, index) => files.indexOf(file) !== index);
  const missing = files.filter((file) => !existsSync(join(rootDir, file)));
  const unassigned = discovered.filter((file) => !files.includes(file));
  const stale = files.filter((file) => !discovered.includes(file));

  if (duplicates.length > 0) {
    console.error(`Duplicate ${kind} files in module map:`);
    for (const file of [...new Set(duplicates)]) console.error(`- ${file}`);
  }
  if (missing.length > 0) {
    console.error(`Missing ${kind} files in module map:`);
    for (const file of missing) console.error(`- ${file}`);
  }
  if (unassigned.length > 0) {
    console.error(`Unassigned ${kind} files:`);
    for (const file of unassigned) console.error(`- ${file}`);
  }
  if (stale.length > 0) {
    console.error(`Mapped ${kind} files not discovered by inventory:`);
    for (const file of stale) console.error(`- ${file}`);
  }

  if (duplicates.length > 0 || missing.length > 0 || unassigned.length > 0 || stale.length > 0) {
    process.exit(1);
  }
}

function checkMapping() {
  const vitestDiscovered = [
    ...walk(join(rootDir, "tests"), /\.(test|spec)\.[cm]?[jt]sx?$/),
    ...walk(join(rootDir, "src"), /\.(test|spec)\.[cm]?[jt]sx?$/),
    ...walk(join(rootDir, "__tests__"), /\.(test|spec)\.[cm]?[jt]sx?$/),
  ].sort();
  const cypressDiscovered = walk(join(rootDir, "cypress"), /(\.cy\.|\.spec\.)[cm]?[jt]sx?$/).sort();

  checkKind("vitest", vitestDiscovered);
  checkKind("cypress", cypressDiscovered);

  const activeCypress = configuredFiles("cypress", false);
  const manualCypress = configuredFiles("cypress", true).filter((file) => !activeCypress.includes(file));
  console.log(`Module map OK: ${configuredFiles("vitest").length} Vitest files, ${activeCypress.length} active Cypress specs, ${manualCypress.length} assigned manual Cypress specs.`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    env: { ...process.env },
  });
  process.exit(result.status ?? 1);
}

function usage() {
  console.error("Usage:");
  console.error("  node tools/run-module-tests.mjs check");
  console.error("  node tools/run-module-tests.mjs vitest <module>");
  console.error("  node tools/run-module-tests.mjs cypress <module>");
}

if (technology === "check") {
  checkMapping();
  process.exit(0);
}

if (!["vitest", "cypress"].includes(technology) || !moduleName) {
  usage();
  process.exit(1);
}

checkMapping();
const entry = moduleMap[technology]?.[moduleName];
if (!entry) {
  console.error(`Unknown ${technology} module: ${moduleName}`);
  process.exit(1);
}
if (!entry.files || entry.files.length === 0) {
  console.error(`No active ${technology} files configured for module ${moduleName}.`);
  process.exit(1);
}

console.log(`Running ${technology} module: ${entry.name} (${entry.files.length} files)`);

if (technology === "vitest") {
  run(process.execPath, [join(rootDir, "node_modules", "vitest", "vitest.mjs"), "run", ...entry.files, ...extraArgs]);
}

const command = process.execPath;
run(command, [
  join(rootDir, "tools", "ci", "run-cypress.mjs"),
  "run",
  "--browser",
  "electron",
  "--spec",
  entry.files.join(","),
  ...extraArgs,
]);
