import http from 'http';
const deps = [
  "/src/components/M3.tsx",
  "/src/features/clerk-desk/components/wordpro/components/DocumentEditor.tsx",
  "/src/contexts/EditorContext.tsx",
  "/src/features/clerk-desk/components/wordpro/components/Ribbon.tsx",
  "/src/features/clerk-desk/components/wordpro/components/StatusBar.tsx",
  "/src/components/OfficialLogo.tsx",
  "/src/components/QRCode.tsx",
  "/src/features/clerk-desk/hooks/useLetterComposer.ts",
  "/src/features/clerk-desk/hooks/useKeyboardShortcuts.ts",
  "/src/features/clerk-desk/services/AIService.ts",
  "/src/features/clerk-desk/services/ExportService.ts",
  "/src/contexts/ToastContext.tsx",
  "/src/features/clerk-desk/components/common/ConfirmDialog.tsx",
  "/src/features/clerk-desk/components/common/SearchBar.tsx",
  "/src/features/clerk-desk/components/common/EmptyState.tsx",
  "/src/features/clerk-desk/utils/formatters.ts",
  "/src/features/clerk-desk/utils/validators.ts",
  "/src/features/clerk-desk/utils/smartLetterParser.ts"
];

let pending = deps.length;
for (const dep of deps) {
  http.get('http://localhost:3003' + dep, (res) => {
    if (res.statusCode !== 200) {
      console.log('FAIL:', dep, res.statusCode);
    }
    if (--pending === 0) console.log('Done');
  });
}
