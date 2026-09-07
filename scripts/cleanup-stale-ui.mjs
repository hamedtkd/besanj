import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const staleFiles = [
  "components/ui/native-select.tsx",
  // Removed when the app migrated from next-themes to the internal theme runtime.
  "components/theme-toggle.tsx",
  // Removed when the Persian date stack migrated from react-day-picker to Doran.
  "components/ui/calendar.tsx",
];

let removed = 0;
for (const file of staleFiles) {
  try {
    await rm(resolve(process.cwd(), file), { force: true });
    removed += 1;
  } catch (error) {
    console.error(`Could not remove stale UI file: ${file}`);
    throw error;
  }
}

if (removed) {
  console.log("Legacy UI cleanup completed.");
}
