const required = [
  ["@doranjs/core", "0.3.0"],
  ["@doranjs/react", "0.9.2"],
  ["@doranjs/ui", "0.0.4"],
];

const missing = [];
for (const [name] of required) {
  try {
    import.meta.resolve(name);
  } catch {
    missing.push(name);
  }
}

if (missing.length) {
  console.error(
    [
      "Missing runtime dependencies: " + missing.join(", "),
      "Run npm install from the project root.",
      "If this project was overlaid on an older folder, remove node_modules and package-lock.json once, then run npm install again.",
      "Pinned Doran packages: npm install @doranjs/core@0.3.0 @doranjs/react@0.9.2 @doranjs/ui@0.0.4",
    ].join("\n")
  );
  process.exit(1);
}

console.log("Runtime dependency check passed.");
