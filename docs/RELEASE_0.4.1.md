# Besanj 0.4.1

- Fixed Doran calendar month navigation snapping back to the selected month.
- Added Doran-style clickable month and year selectors with in-place month/year panels.
- Year picker exposes a 60-year window by default and respects DatePicker min/max years when present.
- Fixed Base UI link-button semantics by setting `nativeButton={false}` when Button renders Next Link.
- Added stale UI cleanup so an old `components/ui/native-select.tsx` left by overlay extraction is removed automatically on install/check/dev.
- Package version bumped to 0.4.1. Doran runtime dependencies remain explicit in `package.json`.
