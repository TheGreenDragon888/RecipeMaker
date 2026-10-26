# AGENTS.md

This file tells AI coding agents (Claude Code, Copilot, Cursor, Codex, etc.) how to work in this repository. It is written for an **Applied Programming** course project: a web or mobile app designed and built by a student. Agents must follow these rules for every change, large or small.

> **Students:** Fill in the "Project Details" section below before you start using agents. The more specific you are, the better your agent will follow your architecture.

---

## Keeping this file current

AGENTS.md is only useful if it matches the code. Update it **in the same change** whenever you:

- add, remove, or rename commands or scripts (`package.json` `scripts`, the commands in §1)
- change the directory structure or move key files (§5.1)
- add, remove, or upgrade major dependencies (§1)
- add or change environment variables or config (`app.json`, `metro.config.ts`, `tsconfig.json`, the `jest` block in `package.json`, `.env*.local`)
- change the architecture or established conventions (§3, §5.2)

If this file contradicts the code, trust the code, fix this file, and mention the fix in your summary. (If the code breaks one of the rules in §3–§5, that is a problem with the code, not the rule: flag it to the student instead of rewriting the rule.)

`CLAUDE.md` contains only `@AGENTS.md`, which makes Claude Code load this file. Put instructions here, not in `CLAUDE.md`.

---

## 1. Project Details (student fills this in)

- **App name:** RecipeMaker
- **One-sentence description:** User inputs what ingredients they have, and the app can sort through recipes based if they need only a few more ingredients, the price to buy the ingredients, and other filters.
- **Current state:** All three layers are built and tested. The UI is four screens. **Pantry** and **Recipes** are tabs: on iOS in the system's own tab bar (`NativeTabs`), on Android in a floating bottom dock (Pantry · Recipes · Bookmarks); **Results** and **Recipe detail** open over the tabs on the Expo Router stack, and neither bar shows on them. **Pantry**: type ingredients with autocomplete; only ingredients in the database can be added. A counted ingredient joins the list at 1 of its pantry unit from `recipes.db` ("1 clove", "1 each"), and − / + step it (up to 99 pantry units; − removes it when a step would leave nothing). Tapping the amount opens the **Amount & Unit Sheet**: −5 / −1 / +1 / +5, a number field, a row of unit chips, and Save (the backdrop, the grab bar and Android's back button close it without saving). Picking a chip converts the amount (2 cups → 32 tbsp; the board's prototype only relabels it), and the row then shows that unit, rounded for it ("2.06 cups", "473 mL", "≈ 6 oz" for an estimate) and steps in it, except that mL and g step by 1 pantry unit. The amount is still kept in the pantry unit, so it can now be a fraction. The sheet slides up above the dock, rises above the keyboard, and only one of it and the Seasoning Tray is open at a time. A seasoning switches on in the **Seasoning Tray** instead, a pull-up sheet of on/off chips above "Find recipes": it grows out of its handle when opened and shrinks back into it when closed, with a tap or by dragging the handle up or the sheet's grab bar and header down; the sheet's top edge follows the finger (it jumps instead when Reduce Motion is on). A staple isn't added, since matching already assumes it. Notices that only inform ("Paprika is on in Seasonings.") fade away after 3 seconds; problems ("Couldn't load suggestions", an unknown ingredient) stay until the user types. Counts and units are shown only and not used in matching; "Find recipes" sends the list's names plus the seasonings that are on. The list (with amounts and shown units) and the seasonings that are on are saved in `user.db` and come back on the next launch, fitted to the recipe data as it is then; a notice says what that changed, and one says so if the saved pantry can't be loaded (see "User data" in §5.2). **Recipes**: every recipe, A to Z, from `listAllRecipes` (the board's Recipes artboard shows pantry-matched results instead; that list is the Results screen). **Results**: recipes ranked by `findRecipesFromPantry`. **Recipe detail**: times, servings, ingredients, steps, a link to the source, similar recipes. Each ingredient is checked against the saved pantry (`checkRecipeAgainstPantry`; see "Pantry checks" in §5.2) and drawn with the board's colored circle: a green check and "have 6 cloves" beside it; an amber dash and "Not enough — have 1/2 lb, need 1/2 lb more" under it; blue arrows and "Swap: use sriracha — you have 4 tbsp" when the pantry lacks it but has the recipe's own "or …" substitute; a clay cross and "Not in your pantry". Short, swapped and missing rows are tinted. A staple gets the check and "staple"; an optional line the pantry lacks gets no circle. A legend above the list shows the circles the recipe uses. With nothing saved in the pantry, or if the check fails, the ingredients show without circles. Results' counts are left as they were: a swap counts as missing there, and amounts aren't compared there. On iOS the tab bar is the system's: Liquid Glass with press-and-hold and swipe on iOS 26, SF Symbols (`cabinet`, `book`, filled when selected), the accent tint, and labels in the system font (the layout asks for Nunito Sans, but the iOS 26 bar ignores it; the request is kept in case a later iOS or Expo honours it); it is set to shrink while scrolling down, but in Expo Go it doesn't shrink on Recipes (each screen's header comes before its list, and iOS only finds a list that comes first). Android's dock background is a blur on Android 12+ and a plain translucent bar on older Android (the dock's Liquid Glass and iOS blur branches are kept but no longer drawn, since iOS doesn't show the dock). Bookmarks is in Android's dock but disabled (half opacity, "coming soon" for screen readers) until saved recipes exist; on iOS it is left out, because the system bar can't draw a tab that looks disabled. The look follows the Claude Design board "RecipeMaker — Current Mockup", with its fonts (Lora, Nunito Sans, Caveat) and its line icons. On iOS the tab bar departs from the board: the system sets its position, height and glass, with no 24 px floating gap, its icons are SF Symbols instead of the board's, and its labels are in the system font. Board parts with no data or service rule behind them yet are left out: ingredient categories, photos, readiness filters and pills (including Recipe detail's "Swap available" pill and its "7 ingredients ready · 1 easy swap suggested" line), and favorites. The recipe banner is a tinted placeholder with an icon instead of a photo. Recipe detail's ingredient rows keep the app's line wording ("1 lb chicken breast", not the board's "Chicken breast — 1 lb"), draw the missing cross with the app's `close` icon (a little larger than the board's), and write the legend's chips at 11 px (the board's are 11.5). From the Seasoning Tray, the "+ Add seasoning" chip is left out (every seasoning is already shown), as is "Bay Leaves" (not in the data). Its closed handle also drops the board's ^ chevron, since the grab bar already shows it pulls up. From the Amount & Unit Sheet, the header's category, "profile" and per-profile icon are left out (no data: it shows the pantry icon and "Counted in cloves"), as are "Common amounts", and its unit chips offer only units the ingredient converts to (see "Pantry units" in §5.2) rather than the board's fixed lists. Board screens not built yet: Full Recipe (Ingredients and Steps tabs), Cook Mode, Mark as Cooked, and Bookmarks. These are tested but no screen uses them yet: the `searchRecipesByIngredient` and `filterRecipes` services, and the `scaleIngredients` domain rule. `convertAmount` in `src/domain/unitConversions.ts`, which converts any counted recipe line to its ingredient's pantry unit, is what the pantry checks compare amounts with (the sheet uses its sibling `convertPantryAmount`).
- **Platform:** Expo Go (Android and iOS)
- **Language(s):** Typescript
- **Frameworks:** React Native 0.88 with React 19.3, Expo SDK 58 (managed workflow: the `ios/` and `android/` folders are git-ignored and never committed), Expo Router for navigation (one file per route in `app/`), `react-native-svg` for icons, `expo-router/native-tabs` (`NativeTabs`, the system tab bar on iOS), `expo-blur` for Android's dock background and `expo-glass-effect` (Liquid Glass; still imported by the dock, but only its iOS branch used it), `expo-font` with `@expo-google-fonts/lora`, `nunito-sans` and `caveat` for the mockup's fonts
- **Setup:** Node.js 22.13+ on the 22 line, 24.3+ on the 24 line, or 26 and later, then `npm install`. Odd-numbered releases (23, 25) aren't supported by Expo SDK 58, and the integration tests need `node:sqlite` without a flag, which arrived in Node 22.13.
- **Environment variables:** none are used yet (no `process.env` reads). If you add any, put them in `.env.local`: `.gitignore` excludes `.env*.local` files, but not a plain `.env`.
- **Data storage:** SQLite on the device via `expo-sqlite` (not the Node `sqlite3` package, which does not run in Expo Go), in two files: the bundled, read-only `recipes.db`, and `user.db` for what the user saves (the pantry). Only the Data Access layer's `open*Database.ts` files may import `expo-sqlite` (see §5.2).
- **Adding dependencies:** use `npx expo install <package>` so the version matches the Expo SDK. Never pass `--force` or `--legacy-peer-deps` to get past an `ERESOLVE` error: they install versions the SDK does not support, and the breakage shows up later (failed tests, crashes in Expo Go). The usual cause is a peer dependency that npm installed at its latest version; fix it by pinning that package with `npx expo install <peer>`. This is why `react-dom`, `react-native-reanimated`, `react-native-worklets` and `react-native-gesture-handler` are listed in `package.json` even though no app code imports them: `expo-router` and the packages it pulls in need them as peer dependencies (`react-native-worklets`, for example, is required by `react-native-reanimated`), so do not remove them.
- **Test framework(s):** Jest 30 with the `jest-expo` preset, configured in the `jest` block of `package.json`. Its `testMatch` only finds `tests/**/*.test.ts(x)`, so test files go under `tests/` (a test next to its source file would never run). Component, screen and route tests use React Native Testing Library 14 (`@testing-library/react-native`), which renders with `test-renderer` (pinned to 1.3.0, the line for React 19.3, matching the copy jest-expo uses; React's own `react-test-renderer` is deprecated and no longer used). See "Testing the UI" in §5.2. Data-layer integration tests run the real SQL against `assets/data/recipes.db` using Node's built-in `node:sqlite` (see §5.2), because `expo-sqlite` only runs on a device.
- **Command to run the app:** `npm run start` starts the Expo dev server (Metro); scan the QR code with Expo Go, or press `a`/`i` to launch on Android/iOS. `npm run android` / `npm run ios` start it targeting one platform directly. Expo Go requires being logged in to an Expo account: run `npx expo login` once on the PC and sign in to Expo Go with the same account. If the phone can't reach the PC on the local network (apartment or guest Wi-Fi often blocks it), use `npx expo start --tunnel`, which in SDK 58 uses Expo's own tunnel and needs that login. The older ngrok tunnel (`--tunnel ngrok`) is not installed: on a network whose proxy stamps plain-http requests, such as apartment Wi-Fi, it makes Expo build a broken download address (`http, http://…`, logged as "Unable to resolve manifest assets … reading '0'"), and Expo Go crashes while loading. Using it again would mean adding `@expo/ngrok` back as a dev dependency (ask first). The App Store's Expo Go runs only the newest SDK, so when it updates, the project has to be upgraded to match. `npm run web` (and `w`) also exist, but web is not set up: `react-native-web` is not installed, and adding it is a new dependency (ask first).
- **Command to run all tests:** `npm test`
- **Command to run a single test file:** `npx jest <path>`, e.g. `npx jest tests/unit/services/filterRecipes.test.ts`
- **Command to type-check:** `npx tsc --noEmit`. `tsconfig.json` extends `expo/tsconfig.base` with `strict: true`, so keep new code strict-mode clean.
- **Command to run the linter/formatter:** tbd. None is set up yet: there is no `lint` script and no ESLint or Prettier config.

---

## 2. How Agents Should Behave in This Project

This is a learning environment. The student is responsible for understanding every line of code in the project. Agents must support that.

1. **Work in small steps.** Make one focused change at a time. Prefer several small, reviewable changes over one large one.
2. **Explain your reasoning.** After each change, briefly state what you changed, which layer it belongs to, and why.
3. **Follow the architecture in Section 3.** If a request would violate it, say so and propose a version that fits.
4. **Follow the test-first process in Section 4.** No production code without a failing test first.
5. **Ask before big decisions.** Adding a new dependency, changing the database schema, restructuring folders, or introducing a new pattern requires the student's approval first.
6. **Do not invent requirements.** If behavior is unclear, ask the student instead of guessing.
7. **Never hide failures.** If tests fail, a command errors, or you are unsure something works, say so plainly.
8. **Keep secrets out of code.** API keys, passwords, and tokens go in environment variables or config files that are excluded by `.gitignore`. Never commit them.

---

## 3. Architecture: Three-Tier Design

Every piece of code in this project belongs to exactly one of three layers. Before writing any code, identify which layer it belongs in.

```
┌─────────────────────────────────────────┐
│  1. PRESENTATION LAYER                  │  What the user sees and touches
│     (UI, screens, components, routes)   │
└───────────────────┬─────────────────────┘
                    │ calls
┌───────────────────▼─────────────────────┐
│  2. BUSINESS LOGIC LAYER                │  The rules of your app
│     (services, domain models, rules)    │
└───────────────────┬─────────────────────┘
                    │ calls (through interfaces)
┌───────────────────▼─────────────────────┐
│  3. DATA ACCESS LAYER                   │  Where data lives and how it's fetched
│     (repositories, DB, APIs, storage)   │
└─────────────────────────────────────────┘
```

### The Dependency Rule

- **Presentation** may call **Business Logic**. It must **never** talk to the Data layer directly.
- **Business Logic** may use the **Data** layer only through **interfaces** (abstract contracts) that the Business layer defines. It must never import a database driver, ORM, HTTP client, or UI framework.
- **Data Access** implements those interfaces. It must never contain business rules and must never import UI code.
- Dependencies point **downward only**. A lower layer never imports from a higher one.

If you catch yourself importing a database library into a UI component, or a UI library into a service, stop: the code is in the wrong layer.

---

### 3.1 Presentation Layer

**Responsibility:** Display information and collect user input. It should be "thin": it knows *how to show things*, not *what the rules are*.

**Belongs here:**
- Screens, pages, views, and UI components
- Navigation and routing
- Local UI state (is this modal open? which tab is selected? is a spinner showing?)
- Form handling and **input format** checks (field is empty, email "looks like" an email) for immediate user feedback
- Formatting data for display (dates, currency, pluralization)
- Calling services in the Business layer and rendering the result or error
- Styling, layout, animations, accessibility attributes
- For web backends: HTTP route handlers / controllers that parse the request, call a service, and turn the result into an HTTP response. These are entry points, so they are presentation code and must stay thin.

**Does NOT belong here:**
- SQL, ORM queries, `fetch` calls to your database or third-party APIs, reading/writing local storage
- Business rules (pricing, permissions, eligibility, scoring, state transitions)
- Calculations that matter to the app's correctness
- Anything you would need to copy if you built a second UI (e.g., a mobile version of your web app)

**Typical locations:**
- Web: `src/ui/`, `src/components/`, `src/pages/`, `src/routes/`, `src/controllers/`
- Mobile: `lib/ui/` (Flutter), `src/screens/` (React Native), `Views/` and `ViewModels/` (SwiftUI/Android)

---

### 3.2 Business Logic Layer

**Responsibility:** The heart of the app. It enforces the rules that make your app *your app*. It should be plain code in your language with no framework dependencies, which makes it the easiest layer to test.

**Belongs here:**
- Domain models / entities (e.g., `Task`, `Workout`, `Order`, `Recipe`) and their behavior
- Business rules and **real validation** (a task's due date cannot be in the past; a user cannot join more than 5 groups; a score cannot be negative)
- Services / use cases that perform one meaningful action (e.g., `completeTask`, `placeOrder`, `logWorkout`)
- Calculations (totals, streaks, averages, rankings, recommendations)
- Authorization rules (who is allowed to do what)
- **Interfaces** for data access (e.g., `TaskRepository` with `findById`, `save`, `delete`)
- Custom domain errors (e.g., `TaskNotFoundError`, `DueDateInPastError`)

**Does NOT belong here:**
- Any import of a UI framework (React, Flutter widgets, SwiftUI, Android views)
- Any import of a database driver, ORM, HTTP client, or storage API
- HTTP status codes, request/response objects, or UI strings meant for display
- Knowledge of *where* data is stored

**Typical locations:** `src/domain/`, `src/services/`, `src/core/`, `lib/domain/`

---

### 3.3 Data Access Layer

**Responsibility:** Store and retrieve data. It translates between your domain models and whatever storage or external service you use.

**Belongs here:**
- Repository implementations (e.g., `PostgresTaskRepository`, `SqliteTaskRepository`, `FirebaseTaskRepository`) that implement the interfaces from the Business layer
- Database queries, ORM models, migrations, schema definitions
- HTTP clients for external APIs (weather, maps, payments, AI services)
- Local device storage (SQLite, AsyncStorage, SharedPreferences, Core Data, IndexedDB)
- Caching
- Mappers that convert database rows or API JSON (DTOs) into domain models and back

**Does NOT belong here:**
- Business rules or decisions ("if the user is premium, then...")
- UI code or display formatting
- Validation beyond what the storage itself requires

**Typical locations:** `src/data/`, `src/repositories/`, `src/infrastructure/`, `lib/data/`

---

### 3.4 Example: One Feature Across All Three Layers

Feature: *"A user can mark a task as complete, but not if it's already complete."*

```ts
// ── BUSINESS LAYER: src/domain/TaskRepository.ts ──
export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
}

// ── BUSINESS LAYER: src/services/completeTask.ts ──
export async function completeTask(repo: TaskRepository, taskId: string): Promise<Task> {
  const task = await repo.findById(taskId);
  if (!task) throw new TaskNotFoundError(taskId);
  if (task.isComplete) throw new TaskAlreadyCompleteError(taskId);   // business rule
  const updated = { ...task, isComplete: true, completedAt: new Date() };
  await repo.save(updated);
  return updated;
}

// ── DATA LAYER: src/data/SqlTaskRepository.ts ──
export class SqlTaskRepository implements TaskRepository {
  constructor(private db: Database) {}
  async findById(id: string) {
    const row = await this.db.get("SELECT * FROM tasks WHERE id = ?", id);
    return row ? toTask(row) : null;                                  // mapping only
  }
  async save(task: Task) { /* INSERT or UPDATE */ }
}

// ── PRESENTATION LAYER: src/ui/TaskItem.tsx ──
function TaskItem({ task, taskService }) {
  const [error, setError] = useState<string | null>(null);
  const onCheck = async () => {
    try { await taskService.complete(task.id); }
    catch (e) { setError("This task is already done."); }             // display only
  };
  return <Checkbox checked={task.isComplete} onChange={onCheck} error={error} />;
}
```

Notice: the rule lives in one place (the service), the SQL lives in one place (the repository), and the UI only displays and reacts.

### 3.5 Wiring the Layers Together

Concrete data implementations are connected to services in **one place** at app startup (often called the *composition root*, e.g., `src/main.ts`, `src/app.ts`, `lib/main.dart`, or a dependency injection container). Services receive repositories as constructor or function parameters; they never create them. This is what lets tests swap in fakes.

---

## 4. Test-First Development (Required)

All production code in this project is written **test-first**. Agents must follow the Red → Green → Refactor cycle for every feature and every bug fix.

### 4.1 The Cycle

1. **RED — Write a failing test.**
   - Write the smallest test that describes one piece of the desired behavior.
   - Run it. Confirm it **fails**, and that it fails **for the expected reason** (e.g., an assertion fails or a function doesn't exist yet, not a typo or broken import).
   - Show the student the failing output.
2. **GREEN — Make it pass with the simplest code.**
   - Write only enough production code to make that test pass. No extra features "while you're in there."
   - Run the test again and confirm it passes. Then run the **full test suite** to confirm nothing else broke.
3. **REFACTOR — Clean up with tests as a safety net.**
   - Improve names, remove duplication, and simplify, without changing behavior.
   - Run the full suite again. It must still be green.
4. **Repeat** with the next small behavior.

### 4.2 Hard Rules for Agents

- **Never write production code before a failing test exists for it.**
- **Never delete, skip, or weaken a test to make it pass.** If a test seems wrong, stop and explain why to the student; let them decide.
- **Never change a test's expected value just to match what the code currently does**, unless the student confirms the requirement changed.
- **Bugs start with a test.** Before fixing a bug, write a test that reproduces it and fails. Then fix it. The test stays forever to prevent regressions.
- **One behavior per test.** If a test name needs the word "and," it's probably two tests.
- **Tests must be deterministic.** No reliance on the current time, random values, network access, or test execution order. Inject clocks and random generators when needed.
- **Do not mark work as done while any test is failing.**

### 4.3 What to Test in Each Layer

Follow the testing pyramid: many fast unit tests at the bottom, fewer slow tests at the top.

| Layer | Test type | What to test | How |
|---|---|---|---|
| **Business Logic** | Unit tests (the majority of your tests) | Every rule, calculation, validation, and error case in services and domain models | Use **fake/in-memory repositories** that implement the interfaces. No database, no network, no UI. These should run in milliseconds. |
| **Data Access** | Integration tests | Repositories correctly save, load, update, delete, and map data | Run against a real test database, in-memory SQLite, an emulator, or recorded API responses. Reset data between tests. |
| **Presentation** | Component / widget tests | Components render the right thing for each state (loading, empty, error, success) and call the right service on user actions | Use your framework's testing library with **mocked services**. Test what the user sees, not internal implementation details. |
| **Whole app** | A few end-to-end tests | The most important user journeys (e.g., sign up → create item → see it in list) | Playwright, Cypress, Detox, Maestro, or integration_test. Keep these few; they're slow. |

**Start new features in the Business layer.** Test-drive the rule first, then the repository, then the UI.

### 4.4 Test Structure and Naming

Use **Arrange → Act → Assert**, and name tests so a failure explains itself:

```ts
describe("completeTask", () => {
  it("marks an incomplete task as complete", async () => {
    // Arrange
    const repo = new InMemoryTaskRepository([{ id: "1", title: "Study", isComplete: false }]);
    // Act
    const result = await completeTask(repo, "1");
    // Assert
    expect(result.isComplete).toBe(true);
  });

  it("throws TaskAlreadyCompleteError when the task is already complete", async () => {
    const repo = new InMemoryTaskRepository([{ id: "1", title: "Study", isComplete: true }]);
    await expect(completeTask(repo, "1")).rejects.toThrow(TaskAlreadyCompleteError);
  });

  it("throws TaskNotFoundError when the task does not exist", async () => {
    const repo = new InMemoryTaskRepository([]);
    await expect(completeTask(repo, "missing")).rejects.toThrow(TaskNotFoundError);
  });
});
```

For every behavior, consider: the normal case, edge cases (empty, zero, maximum, boundary values), and error cases.

### 4.5 Test File Locations

Mirror the source structure so tests are easy to find. Use whichever convention your framework prefers, and be consistent:

- Side by side: `src/services/completeTask.ts` and `src/services/completeTask.test.ts`
- Separate folder: `src/services/completeTask.ts` and `tests/services/completeTask.test.ts`

Shared fakes (like `InMemoryTaskRepository`) go in `tests/fakes/` or `test/support/`.

**In this project:** use the separate folder only. Jest's `testMatch` in `package.json` only picks up `tests/**/*.test.ts(x)`, so a side-by-side test in `src/` would never run. Fakes go in `tests/fakes/`, other test helpers in `tests/support/`.

---

## 5. Suggested Folder Structure

Adapt names to your framework, but keep the three layers clearly separated.

```
src/
├── ui/              # PRESENTATION: screens, components, routes, view models
├── services/        # BUSINESS: use cases / application services
├── domain/          # BUSINESS: models, rules, errors, repository interfaces
├── data/            # DATA ACCESS: repository implementations, API clients, mappers
└── main.*           # Composition root: wires data implementations into services
tests/
├── unit/            # Business layer tests (most tests live here)
├── integration/     # Data layer tests
├── ui/              # Component / widget tests
├── e2e/             # End-to-end tests
└── fakes/           # In-memory repositories and other test doubles
```

### 5.1 RecipeMaker's Actual Structure

This is the layout the project uses. New code goes in the matching folder.

```
.claude/settings.json        # Claude Code project settings (turns on the Expo plugin)
CLAUDE.md                    # Only "@AGENTS.md", so Claude Code loads this file; edit AGENTS.md instead
app/                         # PRESENTATION (routes): Expo Router builds the app from these files (see §5.2)
├── _layout.tsx              #   root: top safe area, status bar, AppFontsGate, RecipeServicesProvider, the Stack
├── (tabs)/                  #   the tab screens, under the tab bar (the group name is not in the URL)
│   ├── _layout.tsx          #   currentTabBar(): NativeTabs on iOS; on Android headless tabs (expo-router/ui), screens in a BlurTargetView, DockBar after it
│   ├── index.tsx            #   "/"                    → PantryScreen
│   └── recipes.tsx          #   "/recipes"             → RecipesScreen
├── results.tsx              #   "/results?pantry=[…]"  → ResultsScreen        (outside the tabs: no tab bar)
└── recipe/[id].tsx          #   "/recipe/42"           → RecipeDetailScreen   (outside the tabs: no tab bar)
app.json                     # Expo config under the `expo` key: app name, icons, scheme, plugins
assets/data/recipes.db       # Bundled, read-only recipe database (see §5.2)
assets/data/migrations/      # One .sql file per recipes.db data version change, e.g. 002-pantry-units.sql (see §5.2)
metro.config.ts              # Adds 'db' to Metro's assetExts so require() can load recipes.db (Expo SDK 58's
                             #   defaults already list it; the line keeps it explicit). Expo CLI compiles this
                             #   file with the project's `typescript` package, so it needs no Node TypeScript flag
package.json                 # Scripts, dependencies, "main": "expo-router/entry", and the Jest config
tsconfig.json                # Extends expo/tsconfig.base: strict, "jsx": "react", Jest and Node types
src/
├── domain/                  # BUSINESS: recipe types, RecipeRepository interface, errors,
│                            #   staples list, search-term normalization, serving scaling,
│                            #   pantry list rules (no repeats, amounts up to 99 pantry units, units,
│                            #   the unit an item is shown in, seasonings on/off), pantry catalog (how
│                            #   each ingredient is tracked), seasoning tray sections, unit conversions
│                            #   and each ingredient's unit chips, PantryRepository interface, savedPantry
│                            #   (how a saved pantry is fitted to new recipe data), pantryCheck (how each
│                            #   recipe line compares with the pantry: have, not enough, swap, missing, ...)
├── services/                # BUSINESS: one use case per file (search, pantry match, filter,
│                            #   recipe detail, similar recipes, ingredient suggestions,
│                            #   ingredient lookup, the full recipe list A to Z, the pantry catalog,
│                            #   loading and saving the pantry, checking a recipe against the saved pantry)
├── data/                    # DATA ACCESS: SqliteRecipeRepository (all recipe queries), SqlitePantryRepository
│                            #   (the pantry in user.db), row mappers, SqlDatabase and WritableSqlDatabase
│                            #   interfaces, data version check, user.db migrations, openRecipeDatabase,
│                            #   openUserDatabase
├── ui/
│   ├── screens/             # PRESENTATION: full pages (PantryScreen, RecipesScreen, ResultsScreen,
│   │                        #   RecipeDetailScreen)
│   ├── components/          # PRESENTATION: props-only pieces used by screens and layouts (recipe card,
│   │                        #   buttons, suggestion list, pantry row, step, source card, state message,
│   │                        #   Icon, DockBar and DockItem for Android's bottom dock, SeasoningDrawer (grows the
│   │                        #   tray out of its handle), SeasoningTray, SeasoningTrayHandle and SeasoningChip,
│   │                        #   SheetParts (grab bar, header, section label, footer button both sheets share),
│   │                        #   BottomSheet (the sliding frame) and AmountSheet (its content), UnitChip,
│   │                        #   IngredientRow, IngredientMark (its colored circle) and PantryCheckLegend for
│   │                        #   Recipe detail's pantry checks)
│   ├── format/              # PRESENTATION: pure display functions (fractions, plurals, ingredient
│   │                        #   lines, ingredient-name capitals, times, servings, yield, source,
│   │                        #   counts, tagline, suggestion highlighting, pantry units, tray text,
│   │                        #   pantryAmount — amounts rounded per unit, the sheet's field, labels and badge;
│   │                        #   pantryCheck — a recipe line's note, the line under it, its circle and the legend)
│   ├── motion/              # PRESENTATION: trayDrag — how the seasoning tray follows a finger and where it settles;
│   │                        #   useReduceMotion — the phone's Reduce Motion setting
│   ├── navigation/          # PRESENTATION: routeParams — screen data to route params and back
│   ├── platform/            # PRESENTATION: tabBar — which tab bar this device shows (iOS's own or the dock);
│   │                        #   dockSurface — which dock background this device can draw;
│   │                        #   dockLayout — the dock's distance from the bottom, and tabScreenClearance — the room
│   │                        #   tab screens leave for either tab bar;
│   │                        #   keyboardLift + useKeyboardOverlap — how far a sheet rises above the keyboard;
│   │                        #   useCloseOnBack — Android's back button closes an open sheet
│   ├── AppFontsGate.tsx     # Loads the mockup's fonts; holds the app back until they load (or fail)
│   ├── RecipeServicesContext.tsx  # Starts the services once; route files get them via useRecipeServices()
│   └── theme.ts             # PRESENTATION: colors, spacing, radii, font sizes, font families,
│                            #   shadows, and the dock's size and clearance, from the mockup
├── createRecipeServices.ts  # Binds services to their repositories; the object the UI calls
└── main.ts                  # Composition root: startRecipeServices() opens recipes.db and wires
                             #   SqliteRecipeRepository and SqlitePantryRepository (which opens user.db
                             #   when first used) into the services
tests/
├── unit/                    # Services and domain rules, using fakes (no database)
├── integration/             # SqliteRecipeRepository, the data version check, and acceptance checks (known
│                            #   recipe counts and search results) run through the real services against recipes.db;
│                            #   pantryUnits checks the ingredients table and that every counted recipe line converts;
│                            #   pantryCheckAgreement checks Recipe detail's pantry checks agree with Results' counts;
│                            #   SqlitePantryRepository and userDatabaseMigrations run on an in-memory database
├── ui/                      # Presentation tests, mirroring src/ui/: format/, screens/, components/,
│                            #   motion/, navigation/, platform/, RecipeServicesContext, AppFontsGate (screens use mocked
│                            #   RecipeServices; AppFontsGate mocks expo-font)
├── app/                     # Route files, with expo-router mocked; recipe/id.test.tsx tests
│                            #   app/recipe/[id].tsx and tabs/ tests app/(tabs)/ (no brackets or parentheses:
│                            #   Jest path patterns treat them as special)
├── config/                  # metro.config.ts, loaded through Expo CLI's own loader (runs in Jest's node environment)
├── fakes/                   # InMemoryRecipeRepository, makeRecipe(), makeIngredient(), InMemoryPantryRepository
└── support/                 # nodeSqliteDatabase (SqlDatabase adapter over node:sqlite for recipes.db, and
                             #   openMemoryDatabaseForTest, a writable in-memory stand-in for user.db); screen.ts (shownText,
                             #   shownIcons, styleOf, fadedViews, fadesAsOnePicture, pressIn, tapTwiceBeforeRedraw, recipe-card and list helpers on
                             #   top of RNTL's screen); recordProps (a route test's view of its screen's props);
                             #   drag() (plays a finger drag through PanResponder)
```

### 5.2 Project-Specific Rules

- **Only the `src/data/open*Database.ts` files import `expo-sqlite`:** `openRecipeDatabase.ts` (recipes.db) and `openUserDatabase.ts` (user.db). Repositories depend on the small `SqlDatabase` interface in `src/data/SqlDatabase.ts` instead, or on `WritableSqlDatabase` when they write (only user.db's do), so the recipe repository can't write. expo-sqlite's `SQLiteDatabase` satisfies both on the device; `tests/support/nodeSqliteDatabase.ts` satisfies them in tests.
- **The UI gets services, never a database or repository.** `app/_layout.tsx` wraps the app in `RecipeServicesProvider`, which calls `startRecipeServices()` once and shows a loading or error message until the services are ready. Route files in `app/` get the object with `useRecipeServices()` and pass it to their screen as the `services` prop (type `RecipeServices`). Do not use `SQLiteProvider` or `useSQLiteContext()` in components.
- **Rules live in services, not SQL.** Repository methods are plain lookups (by id, by ingredient, by alias, lists). Decisions such as which ingredients count as missing, what "serves N people" means, ranking order, and result limits belong in `src/services/` or `src/domain/`, where they are unit-tested with `InMemoryRecipeRepository`.
- **Screens go in `src/ui/screens/`, reusable components in `src/ui/components/`.** A screen is a full page the user navigates to; a component is a piece used by one or more screens. Both are `.tsx` files and follow the Presentation layer rules in §3.1.
- **Screens call services; components get data through props.** Only screens call `RecipeServices` (route files only hand it over), and screens own the loading and error states. Components never call services. They receive the data to show (e.g. a `RecipeSummary`) and callbacks for user actions (e.g. `onPress`) as props, so they can be tested by rendering them with plain values and reused on any screen.
- **Route files stay thin.** Each file in `app/` gets the services, reads its route params, renders one screen from `src/ui/screens/`, and turns the screen's callbacks (`onFindRecipes`, `onOpenRecipe`, `onBack`, ...) into `router` calls. Screens never import `expo-router`, so their tests need no router. Route params are always strings: convert them with the tested helpers in `src/ui/navigation/routeParams.ts` (the pantry list travels as JSON; recipe ids go through `recipeHref` and `recipeIdFromParam`). "Back to pantry" and "Return to Pantry" use `router.dismissTo('/')`, which closes the screens over the tabs and switches to the Pantry tab, with its list still there. Route files are tested in `tests/app/` with `jest.mock('expo-router')`.
- **Styling comes from `src/ui/theme.ts`.** Take colors from `theme.colors` instead of writing hex values, and use its spacing, radius, font-size and shadow names where one fits. Set text weight with `fontFamily: fonts.<weight>` (`regular`, `semibold`, `bold`, `heavy`; `heading` for Lora headings, `handwritten` for Caveat), never `fontWeight`: a custom font picks its weight by family name, and every `Text` style needs a `fontFamily` because React Native has no app-wide default font. A new font weight must also be added to `AppFontsGate`. Icons come from `src/ui/components/Icon.tsx`, which copies the board's 24×24 SVG shapes; add a new icon there rather than drawing SVG in a screen. Each icon's drawing has the test ID `icon-<name>`, since screen readers skip icons. **A view that fades with `opacity`** (pressed, disabled, or animated) and draws more than one piece (a fill under a label, an icon beside text) sets `needsOffscreenAlphaCompositing`. Without it, Android fades each piece on its own and a darker patch shows where they overlap; iOS already fades a view as one picture. Leave it off a view that is one flat color (the sheet backdrops), where it only adds drawing, and off `Text`, where Android doesn't support it. Test it with `fadedViews()` and `fadesAsOnePicture()` from `tests/support/screen.ts`. A see-through view also shows any Android shadow drawn behind it, and Android draws an `elevation` shadow under the whole view that casts it, so a view holding one that fades gets a solid fill the same shape (the "Find recipes" holder is filled with `colors.background`, or its shadow showed through the disabled button as a box).
- **The tab bar belongs to `app/(tabs)/`.** `app/(tabs)/_layout.tsx` draws one of two tab bars, picked by the tested `currentTabBar()` in `src/ui/platform/tabBar.ts`: iOS's own tab bar (`NativeTabs` from `expo-router/native-tabs`) on iOS, and the board's floating dock on Android. A screen gets a tab by having its route file in `app/(tabs)/` and both a `NativeTabs.Trigger` (with an SF Symbol `Icon` and a `Label`) and a `TabTrigger` in that layout; screens that open over the tabs (Results, Recipe detail, and future ones like Cook Mode) stay outside the folder so neither bar shows. Never add or hide a `NativeTabs.Trigger` while the app runs: that remounts the tabs and loses their state (the pantry list). Keep the split in the one layout file rather than an `_layout.ios.tsx`, because Jest resolves files as iOS and would quietly test the iOS file in place of the Android one. On Android the layout uses the headless tabs from `expo-router/ui` (not `Tabs` or `NativeTabs`) because the Android blur needs the screens inside a `BlurTargetView` and the dock outside it. `TabTrigger`s must be direct children of `DockBar` with `asChild`, or the tabs won't find them. The root layout's safe area pads only the top: tab screens run to the bottom edge, and every other stack screen gets the bottom inset as padding (`contentStyle` in `app/_layout.tsx`). The dock sits `dockOffset(insets.bottom)` from the bottom (the board's 24 px, or just above the home indicator) and floats over the screens. A tab route passes `tabScreenClearance({ tabBar: currentTabBar(), bottomInset: insets.bottom })` to its screen as `bottomClearance`, and the screen leaves that much room at the bottom of its content: on Android the dock's clearance, on iOS the safe area's bottom inset, which inside an iOS tab already includes the system bar (83 = 49 + 34 on a 390×844 iPhone, measured in Expo Go), plus the board's 24 px dock gap so content doesn't sit right on the bar. These functions are in `src/ui/platform/dockLayout.ts`. Which background the dock draws (Liquid Glass, blur, Android blur, translucent) is decided by the tested `src/ui/platform/dockSurface.ts`; `DockBar` only draws the one it is given.
- **Display text lives in `src/ui/format/`.** Business and data code return raw values (numbers, booleans, singular names); pluralizing, fractions, "≈" markers and joined strings are presentation.
- **`recipes.db` is read-only.** It is copied over the device copy on every launch (`forceOverwrite: true`), so never write user data to it and never enable WAL on it. User data goes in `user.db` instead (see "User data" below), which refers to recipes by `recipe_id` and to ingredients by their name in the `ingredients` table.
- **User data (`user.db`).** It holds what the user saves: for now the pantry list (`pantry_items`) and the seasonings that are on (`seasonings_on`), each keyed by ingredient name and kept in order by `position`. Bookmarks will add a table here.
  - **Its tables change only through migrations.** user.db is never replaced, so each change is a new step at the end of `MIGRATIONS` in `src/data/userDatabaseMigrations.ts`, which raises `PRAGMA user_version` by one; never edit a step that has shipped. A user.db newer than the code (after going back to an older app) throws `UserDataVersionError`. Test each step in `tests/integration/userDatabaseMigrations.test.ts`.
  - **It never blocks the recipes.** `SqlitePantryRepository` opens it the first time the pantry is loaded or saved, not in `startRecipeServices()`. It runs loads and saves one at a time (expo-sqlite's `withTransactionAsync` isn't exclusive, so two would overlap), and each save replaces the whole pantry in one transaction.
  - **A saved pantry is fitted to the recipe data on every load,** by `restoreSavedPantry` in `src/domain/savedPantry.ts`, after `loadSavedPantry` follows renamed ingredients through their aliases. An item that is now a seasoning switches on in the tray; a seasoning that is now counted joins the list at 1; a changed pantry unit converts the amount (or resets it to 1), and a shown unit that is no longer a chip is dropped; staples are dropped quietly; anything no longer in the data is dropped and named in a notice that stays until the user types. Bad rows (an amount of 0 or less, a repeated name) are dropped and amounts over 99 are capped.
  - **The Pantry screen saves only after a successful load.** It keeps adding (the field and the tray) off until the saved pantry loads, then saves every change, starting with the loaded pantry so the fitting is kept. If loading fails it starts empty, says so, and saves nothing that session, so it never overwrites a saved pantry it couldn't read. A failed save shows a notice and is tried again on the next change.
- **Updating the recipe data:** replace `assets/data/recipes.db`, bump its `PRAGMA user_version`, and bump `RECIPE_DATA_VERSION` in `src/data/recipeDataVersion.ts` to match. Keep existing `recipe_id` values stable and never reuse a deleted ID. When renaming an ingredient, add its old name to `ingredient_aliases`, so pantries saved under the old name follow it to the new one. Make each change with a SQL script in `assets/data/migrations/`, named for the version it produces (`002-pantry-units.sql` made version 2). Run it once against the previous version, then commit the script and the new `recipes.db` together. Write each `UPDATE` to name the old value too, so a second run changes nothing. Every ingredient a recipe line or alias uses needs a row in the `ingredients` table: `tests/integration/pantryUnits.test.ts` fails without it, and also fails when a counted recipe line has no conversion in `src/domain/unitConversions.ts`.
- **Pantry units.** The `ingredients` table says how the pantry tracks each canonical ingredient: `presence` (on or off, no unit) or `count` (an amount from more than 0 up to 99 in its singular `default_unit`: whole numbers from − / +, and fractions once the user sets an amount in another unit). Choose by these rules, in order:
  1. Seasonings are `presence`, because recipes rarely use enough to need a count. This covers dried spices and blends, fresh herbs, garnishes (sesame seed, lemon zest, sprinkles), vanilla extract, baking powder, and hot sauce. Seasoning packets are the exception: a recipe uses a whole packet, so they're counted by `package`. Staples (`src/domain/staples.ts`) are `presence` too.
  2. Produce is counted by the whole piece you store: `each`, `clove` for garlic, `stalk` for celery and green onion, `inch` for ginger, and `each` for a head of cabbage. Produce too small or loose to count one by one is measured in `cup`: bagged greens, corn kernels, frozen vegetables, small tomatoes, raisins. Produce sold in labelled packages by weight (mushrooms, broccoli) is counted in that weight.
  3. Everything else uses the unit its recipe lines use most, with ties decided by hand. The unit must keep a normal store package at 99 or less (oil isn't counted in tbsp).

  A recipe line in another unit needs a factor in `unitConversions.ts`: 1 recipe unit = `factor` pantry units. Give its source in a comment (a recipe line's own "(about 2 cups)", USDA FoodData Central, or a label). Mark it `exact` only when it holds by definition. A product filed under the wrong ingredient (canned diced tomatoes under fresh "tomato") gets its own ingredient, not a conversion.

  **Showing an item in another unit** (the amount sheet's chips, `pantryUnitChoices`): the pantry unit first; then the same kind (volume: tsp, tbsp, cup, mL, L; weight: oz, lb, g, kg); then the weights, when one of the ingredient's factors reaches a weight; then the count units listed for that ingredient (`COUNT_CHOICES`: dozen for egg). Volumes are never offered for something counted another way, because the factors that reach them describe chopped or cooked food (a cup of chopped onion). Metric units are stored in lower case (`ml`, `l`) and shown as "mL" and "L". The item keeps its amount in the pantry unit (`quantity`) and remembers the unit picked (`shownUnit`); conversions keep full precision, and `cleanAmount` drops float noise once, when an amount is stored. `tests/integration/pantryUnits.test.ts` checks that every chip converts out and back to the same amount.
- **Animation uses React Native's own `Animated` and `PanResponder`.** Reanimated and Gesture Handler are installed only as `expo-router`'s peer dependencies; using them in app code would be a new pattern (§2.5). Keep the decisions (when a drag starts, how far the sheet moves, where it settles) in pure functions under `src/ui/motion/` so they're unit-tested, and let the component only run them. Check Reduce Motion with `useReduceMotion()` (`src/ui/motion/`) and jump instead of sliding when it's on. Tests drive animations with Jest's fake timers, and gestures with `drag()` from `tests/support/drag.ts`.
- **Sheets are drawn in the screen, not in a `Modal`.** A `Modal` would cover Android's dock and play its own animation, which ignores Reduce Motion. A new sheet goes in `BottomSheet` (or, like the seasoning tray, a drawer of its own), with its backdrop stopping at the screen's `bottomClearance` so the tab bar stays uncovered (iOS's own bar always draws on top of React Native views; the clearance still sets where the sheet rests), and builds its content from `SheetParts`. Every sheet closes on Android's back button through `useCloseOnBack` (`BackHandler`). A sheet with a text field rises above the keyboard: `useKeyboardOverlap` listens to React Native's `Keyboard` (the "will" events on iOS, "did" on Android) and the pure `liftedSheetBottom` says where the sheet goes; tests play the keyboard with `DeviceEventEmitter.emit('keyboardWillShow', …)`. Android's keyboard height leaves out the navigation bar, so the route passes the safe area's `bottomInset` down for it; this is read from React Native's source and still needs checking on a real Android phone.
- **Nothing hangs outside its parent.** On Android a view is clipped to its parent's edges here (a tab screen's views sit straight inside react-native-screens' `Screen`, which clips its children), so a dropdown or popover hanging out of its parent with `top: '100%'` is never drawn, though iOS shows it. Float it from the screen itself instead, inside a parent that covers it: the Pantry screen's ingredient suggestions and notices are placed from the field's measured `onLayout`. Android also draws a screen's views in order of elevation before `zIndex`, so a floating view needs at least the elevation of whatever it must cover (the "Find recipes" button has 6).
- **Testing the UI.** Tests use React Native Testing Library: `await render(...)`, then find things the way a user would, through `screen` (by role, label or text; a test ID only when nothing visible fits), and act with `await fireEvent.press(...)` / `fireEvent.changeText(...)`. Everything is async, so `await` it. RNTL sees only native views, not our components or their props, so a test checks what is shown (text, icons, accessibility state, style) rather than which component received which prop; `tests/support/screen.ts` has the shared helpers. Use `fireEvent.press` rather than `userEvent.press`: it still goes through the button's real `onPress` and respects `disabled`, without `userEvent`'s 130 ms per tap. Route tests are about wiring, so they wrap the real screen with `recordProps` (in `jest.mock`) and check the props it got. A third-party native view that hides what it was given (expo-blur's `BlurView` turns its target into a native id) is replaced in that test file by a plain stand-in that shows its props; so is `expo-router/native-tabs`, whose pieces draw nothing in React Native. Test code that differs by platform through a mocked chooser (`currentTabBar`, `currentDockSurface`), or set `Platform.OS` with `jest.replaceProperty`; don't rely on Jest running as iOS by default. RNTL unmounts what a test rendered after each test.
- **Pantry checks.** `checkRecipeLines` in `src/domain/pantryCheck.ts` decides how each recipe line compares with the pantry, in this order: a staple is `staple`; an ingredient on the list is `have`, or `notEnough` when the recipe's lines of it together need more than the pantry holds (a range needs its smaller amount; optional lines, lines without an amount, and seasonings are never short); then `swap`, when the line's `substitute` resolves to something on hand (a staple counts); then `optional` for an optional line; else `missing`. Amounts come back in the line's unit when they convert, else as the pantry shows them. The student asked to leave Results as it is, so `findRecipesFromPantry` doesn't use this rule, and what counts (staples, optional lines, alias names) is decided in both places. `tests/integration/pantryCheckAgreement.test.ts` keeps them in step: Results' on-hand count must equal Have + Not enough, and its missing count Missing + Swap. Change both together.
- **The seasoning tray** shows the `presence` ingredients except staples, grouped by `groupSeasonings` in `src/domain/seasonings.ts`. A new seasoning falls under "Spices & herbs" unless it's added to the Everyday or Baking & extras lists there.
- **The entry point is `expo-router/entry`.** `package.json`'s `"main"` points to it. It builds the app from the `app/` folder and then calls `registerRootComponent` from `expo` rather than a plain `AppRegistry.registerComponent` call; this is what makes the same entry work in both Expo Go and native builds. There is no `index.ts` or `App.tsx`: the app shell is `app/_layout.tsx`, and `app/(tabs)/_layout.tsx` adds the tab bar.
- **Device-only files** (`src/data/openRecipeDatabase.ts`, `src/data/openUserDatabase.ts`, `src/main.ts`, `app/_layout.tsx`) cannot run under Jest. Keep them to wiring only, and put any logic they need in a separate, tested piece (as with `assertRecipeDataVersion`, `migrateUserDatabase`, `RecipeServicesProvider` for the layout's loading and error states, and `AppFontsGate` for font loading).
- **Each source file names its layer.** Files in `src/` (and some in `app/`) start with a comment that says which layer they belong to and what they do, e.g. `// BUSINESS LAYER: ingredient autocomplete.` or `// PRESENTATION LAYER (route "/"): …`. Start new files the same way.
- **Write TypeScript, not JavaScript.** Every source, test and config file is `.ts` or `.tsx`, including `metro.config.ts`; do not add `.js` files. `tests/config/metroConfig.test.ts` checks that Expo CLI can still read the Metro config.
- **`.tsx` files `import React from 'react'`**, as every one does now. `tsconfig.json` sets `"jsx": "react"` (the classic JSX transform), which expects `React` in scope wherever JSX is used.

---

## 6. Workflow for Every Task

When the student asks for a feature or fix, the agent should:

1. **Restate the requirement** in one or two sentences and ask about anything ambiguous.
2. **Identify the layers involved** and list the files you expect to create or change.
3. **Write the first failing test** (usually in the Business layer). Run it and show that it fails.
4. **Implement the minimum code** to pass. Run the full suite.
5. **Refactor** if needed. Run the full suite again.
6. **Repeat** steps 3–5 for the next behavior, moving outward to the Data and Presentation layers.
7. **Summarize** what was done: tests added, files changed, which layer each change belongs to, and anything the student should review or decide.

---

## 7. Definition of Done

A change is complete only when **all** of these are true:

- [ ] Every new behavior has a test that was written first and seen failing
- [ ] The full test suite passes
- [ ] Code is in the correct layer and follows the Dependency Rule
- [ ] No business rules in the UI; no database or API code in services
- [ ] No tests were deleted, skipped, or weakened without the student's approval
- [ ] Linter/formatter passes (none is set up yet; see §1)
- [ ] AGENTS.md is updated if the change touched anything listed in "Keeping this file current"
- [ ] No secrets, credentials, or personal data committed
- [ ] The agent has explained the change so the student can understand and defend it

---

## 8. Common Mistakes to Refuse or Flag

Agents should push back on (and explain) any of these:

- Calling `fetch`, an ORM, or local storage directly inside a UI component
- Putting `if` statements that encode business rules inside a component or route handler
- Services that import UI or database libraries
- Writing implementation first and "adding tests later"
- Tests that hit the real network or production database
- Giant commits that touch many features at once
- Copying the same rule into several places instead of putting it in one service
