# Copilot Instructions for Scanner Programmer

## Project Overview
- **Purpose:** Manage and present barcode lists for programming scanner devices.
- **Tech Stack:** React (TypeScript), Vite, shadcn/ui, Radix UI, Tailwind CSS, pnpm.
- **Main UI:** All logic is in `src/App.tsx`. UI primitives are in `src/components/ui/` (Button, Input, Card).

## Architecture & Data Flow
- **Barcode List:** State managed in `App.tsx` as an array of `{ id, value, note }`.
- **Persistence:** Barcode list and delay are saved to `localStorage` on every change via `useEffect`. On load, state is initialized from localStorage.
- **Modes:**
  - **Edit Mode:** Inline editing of barcode value/note, toggled by Pencil icon.
  - **Program Mode:** Sequentially presents barcodes with a delay, disables keyboard input.
- **Drag & Drop:** List items can be reordered by dragging. See drag logic in `App.tsx`.

## Developer Workflows
- **Install:** `pnpm install`
- **Dev Server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Preview:** `pnpm preview`
- **No test scripts yet.**

## UI & Component Patterns
- **shadcn/ui:** All UI elements use shadcn conventions. Extend from `src/components/ui/`.
- **Radix Icons:** Use `@radix-ui/react-icons` for UI icons (e.g., Trash, Pencil).
- **Styling:** Tailwind CSS via `index.css`. Use utility classes and custom properties.
- **Barcode Rendering:** Uses `react-barcode` for barcode display.

## Conventions & Patterns
- **State:** Use React hooks for all state. No Redux/MobX.
- **Persistence:** Always update localStorage on barcode or delay change.
- **Accessibility:** Buttons use `aria-label` for icons.
- **File Structure:**
  - Main logic: `src/App.tsx`
  - UI primitives: `src/components/ui/`
  - Utility: `src/lib/utils.ts`
- **No backend/API integration.**

## Integration Points
- **External:**
  - `react-barcode` for barcode rendering
  - `@radix-ui/react-*` for UI primitives and icons
  - `shadcn/ui` for component styling

## Examples
- **Add/Edit/Delete barcode:** See list logic in `App.tsx`.
- **Drag to reorder:** Handlers in `App.tsx`.
- **Program mode:** Disables keyboard, cycles barcodes with delay.

## Quickstart for AI Agents
- Start in `src/App.tsx` for all main logic.
- Use shadcn UI patterns for new components.
- Always persist changes to localStorage.
- Use pnpm for all scripts.
- No backend or API calls required.

---
If any conventions or workflows are unclear, ask the user for clarification or examples before making changes.