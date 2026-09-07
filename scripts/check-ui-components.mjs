import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = ["app", "components"];
const EXEMPT_UI = new Set([
  "components/ui/select.tsx",
  "components/ui/input.tsx",
  "components/ui/price-input.tsx",
  "components/ui/input-group.tsx",
  "components/ui/date-picker.tsx",
  "components/ui/mobile-number-input.tsx",
  "components/ui/integer-input.tsx",
  "components/ui/textarea.tsx",
  "components/ui/responsive-sheet.tsx",
]);

const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if ([".ts", ".tsx"].includes(extname(entry.name))) await inspect(full);
  }
}

async function inspect(file) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  const source = await readFile(file, "utf8");
  if (!EXEMPT_UI.has(rel)) {
    if (/<select\b/.test(source)) violations.push(`${rel}: native <select> is forbidden; use PersianLabs Select.`);
    if (/type=["']date["']/.test(source)) violations.push(`${rel}: native date input is forbidden; use the app DatePicker (Doran engine).`);
    if (/native-select/i.test(source)) violations.push(`${rel}: NativeSelect is forbidden; use PersianLabs Select.`);
    if (/type=["']checkbox["']/.test(source)) violations.push(`${rel}: native checkbox is forbidden; use PersianLabs Checkbox.`);
    if (/<button\b/.test(source)) violations.push(`${rel}: raw <button> is forbidden; use PersianLabs Button.`);
    if (/<input\b/.test(source)) violations.push(`${rel}: raw <input> is forbidden; use PersianLabs Input or a specialized input.`);
    if (/<textarea\b/.test(source)) violations.push(`${rel}: raw <textarea> is forbidden; use PersianLabs Textarea.`);
    if (/PriceInput/.test(source) && !/InputGroup/.test(source)) {
      violations.push(`${rel}: PriceInput must be composed with InputGroup + Toman addon.`);
    }

    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (!/<Select(?:<|\s|>)/.test(line)) return;
      const window = lines.slice(index, index + 12).join("\n");
      if (!/\bitems=/.test(window)) {
        violations.push(`${rel}:${index + 1}: PersianLabs Select must receive an items map so SelectValue renders the Persian label instead of the raw value/id.`);
      }
    });
  }
}

for (const root of SCAN_ROOTS) await walk(join(ROOT, root));

if (violations.length) {
  console.error("PersianLabs UI policy violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("UI policy check passed: no forbidden native replacements found.");
