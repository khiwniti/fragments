#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const reportOnly = args.has('--report');
const jsonOutput = args.has('--json');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.vercel',
  'playwright-report',
  'test-results',
  'portfolio-mcp-ui',
  'share-state-gen-ui',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const toRelative = (filePath) => path.relative(root, filePath).replaceAll('\\', '/');
const sourceFiles = walk(root);
const sourceFileSet = new Set(sourceFiles.map(toRelative));

function resolveCandidate(basePath) {
  const candidates = [];

  for (const extension of EXTENSIONS) candidates.push(`${basePath}${extension}`);
  for (const extension of EXTENSIONS) candidates.push(path.join(basePath, `index${extension}`));
  candidates.push(basePath);

  for (const candidate of candidates) {
    const relative = toRelative(candidate);
    if (sourceFileSet.has(relative)) return relative;
  }

  return null;
}

function resolveImport(fromFile, specifier) {
  let basePath = null;

  if (specifier.startsWith('@/')) {
    basePath = path.join(root, specifier.slice(2));
  } else if (specifier.startsWith('.') || specifier.startsWith('/')) {
    basePath = specifier.startsWith('/')
      ? path.join(root, specifier)
      : path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  return resolveCandidate(basePath);
}

function externalPackageName(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('@/') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0].split('.')[0];
}

function extractImportSpecifiers(source) {
  const specifiers = [];
  const importRegex = /import\s+(?:type\s+)?(?:[^'"()]+?\s+from\s+)?["']([^"']+)["']|export\s+(?:type\s+)?(?:[^'"()]+?\s+from\s+)["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)|from\s+([\w.]+)\s+import|import\s+([\w.]+)/g;
  let match;

  while ((match = importRegex.exec(source))) {
    specifiers.push(match[1] || match[2] || match[3] || match[4] || match[5]);
  }

  return specifiers;
}

const graph = new Map();
const externalDeps = new Map();

for (const sourceFile of sourceFiles) {
  const relativeFile = toRelative(sourceFile);
  const source = fs.readFileSync(sourceFile, 'utf8');
  const internal = [];
  const external = [];

  for (const specifier of extractImportSpecifiers(source)) {
    const resolved = resolveImport(sourceFile, specifier);
    if (resolved) {
      internal.push(resolved);
      continue;
    }

    const packageName = externalPackageName(specifier);
    if (packageName) external.push(packageName);
  }

  graph.set(relativeFile, [...new Set(internal)]);
  externalDeps.set(relativeFile, [...new Set(external)]);
}

const incoming = new Map([...sourceFileSet].map((file) => [file, 0]));
const dependents = new Map([...sourceFileSet].map((file) => [file, []]));

for (const [file, deps] of graph) {
  for (const dep of deps) {
    incoming.set(dep, (incoming.get(dep) ?? 0) + 1);
    dependents.get(dep)?.push(file);
  }
}

function findCycles() {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indexes = new Map();
  const lowlinks = new Map();
  const cycles = [];

  function visit(file) {
    indexes.set(file, index);
    lowlinks.set(file, index);
    index += 1;
    stack.push(file);
    onStack.add(file);

    for (const dep of graph.get(file) ?? []) {
      if (!indexes.has(dep)) {
        visit(dep);
        lowlinks.set(file, Math.min(lowlinks.get(file), lowlinks.get(dep)));
      } else if (onStack.has(dep)) {
        lowlinks.set(file, Math.min(lowlinks.get(file), indexes.get(dep)));
      }
    }

    if (lowlinks.get(file) === indexes.get(file)) {
      const component = [];
      let current;

      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== file);

      if (component.length > 1 || (graph.get(file) ?? []).includes(file)) {
        cycles.push(component.sort());
      }
    }
  }

  for (const file of sourceFileSet) {
    if (!indexes.has(file)) visit(file);
  }

  return cycles.sort((a, b) => b.length - a.length);
}

const bestPathMemo = new Map();
function bestDependencyPath(file, seen = new Set()) {
  if (seen.has(file)) return [file];
  if (bestPathMemo.has(file)) return bestPathMemo.get(file);

  let best = [file];
  for (const dep of graph.get(file) ?? []) {
    const candidate = [file, ...bestDependencyPath(dep, new Set([...seen, file]))];
    if (candidate.length > best.length) best = candidate;
  }

  bestPathMemo.set(file, best);
  return best;
}

function impact(file, seen = new Set()) {
  let count = 0;
  for (const dependent of dependents.get(file) ?? []) {
    if (seen.has(dependent)) continue;
    seen.add(dependent);
    count += 1 + impact(dependent, seen);
  }
  return count;
}

const cycles = findCycles();
const internalEdges = [...graph.values()].reduce((total, deps) => total + deps.length, 0);
const externalEdges = [...externalDeps.values()].reduce((total, deps) => total + deps.length, 0);
const rows = [...sourceFileSet].map((file) => {
  const pathChain = bestDependencyPath(file);
  return {
    file,
    incoming: incoming.get(file) ?? 0,
    outgoing: graph.get(file)?.length ?? 0,
    external: externalDeps.get(file)?.length ?? 0,
    impact: impact(file),
    depth: pathChain.length - 1,
  };
});

const hotspots = [...rows]
  .sort((a, b) => (b.impact + b.incoming * 3 + b.outgoing + b.depth) - (a.impact + a.incoming * 3 + a.outgoing + a.depth))
  .slice(0, 15);

const criticalPaths = [...rows]
  .filter((row) => row.outgoing > 0)
  .sort((a, b) => b.depth - a.depth)
  .slice(0, 8)
  .map((row) => ({ length: row.depth, path: bestDependencyPath(row.file) }));

const externalPackages = {};
for (const deps of externalDeps.values()) {
  for (const dep of deps) externalPackages[dep] = (externalPackages[dep] ?? 0) + 1;
}

const result = {
  summary: {
    files: sourceFiles.length,
    internalEdges,
    externalEdges,
    averageInternalImports: Number((internalEdges / Math.max(sourceFiles.length, 1)).toFixed(2)),
    cycles: cycles.length,
  },
  cycles,
  hotspots,
  criticalPaths,
  externalPackages: Object.entries(externalPackages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count })),
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Dependency health');
  console.log('=================');
  console.log(`Files: ${result.summary.files}`);
  console.log(`Internal edges: ${result.summary.internalEdges}`);
  console.log(`External edges: ${result.summary.externalEdges}`);
  console.log(`Average internal imports/file: ${result.summary.averageInternalImports}`);
  console.log(`Circular dependency groups: ${result.summary.cycles}`);

  console.log('\nTop hotspots');
  for (const row of hotspots.slice(0, 10)) {
    console.log(`- ${row.file} | in=${row.incoming} out=${row.outgoing} impact=${row.impact} depth=${row.depth}`);
  }

  console.log('\nCritical paths');
  for (const criticalPath of criticalPaths.slice(0, 5)) {
    console.log(`- ${criticalPath.length}: ${criticalPath.path.join(' -> ')}`);
  }

  if (cycles.length > 0) {
    console.log('\nCircular dependency groups');
    for (const cycle of cycles) console.log(`- ${cycle.join(' <-> ')}`);
  }
}

if (!reportOnly && cycles.length > 0) {
  console.error(`\nDependency check failed: found ${cycles.length} circular dependency group(s).`);
  process.exit(1);
}
