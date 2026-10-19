# AGENTS.md

This file tells AI coding agents (Claude Code, Copilot, Cursor, Codex, etc.) how to work in this repository. It is written for an **Applied Programming** course project: a web or mobile app designed and built by a student. Agents must follow these rules for every change, large or small.

> **Students:** Fill in the "Project Details" section below before you start using agents. The more specific you are, the better your agent will follow your architecture.

---

## Keeping this file current

AGENTS.md is only useful if it matches the code. Update it **in the same change** whenever you:

- add, remove, or rename commands or scripts (`package.json` `scripts`, the commands in §1)
- change the directory structure or move key files (§5.1)
- add, remove, or upgrade major dependencies (§1)
- add or change environment variables or config (`app.json`, `metro.config.js`, `tsconfig.json`, the `jest` block in `package.json`, `.env*.local`)
- change the architecture or established conventions (§3, §5.2)

If this file contradicts the code, trust the code, fix this file, and mention the fix in your summary. (If the code breaks one of the rules in §3–§5, that is a problem with the code, not the rule: flag it to the student instead of rewriting the rule.)

`CLAUDE.md` contains only `@AGENTS.md`, which makes Claude Code load this file. Put instructions here, not in `CLAUDE.md`.

---

## 1. Project Details (student fills this in)

- **App name:** RecipeMaker
- **One-sentence description:** User inputs what ingredients they have, and the app can sort through recipes based if they need only a few more ingredients, the price to buy the ingredients, and other filters.
- **Current state:** All three layers are built and tested. The UI is four screens. **Pantry** and **Recipes** are tabs in a floating bottom dock (Pantry · Recipes · Bookmarks); **Results** and **Recipe detail** open over the tabs on the Expo Router stack, and the dock is hidden on them. **Pantry**: type ingredients with autocomplete; only ingredients in the database can be added; each has a count from 1 to 99 set with − / +, shown only and not used in matching. **Recipes**: every recipe, A to Z, from `listAllRecipes` (the board's Recipes artboard shows pantry-matched results instead; that list is the Results screen). **Results**: recipes ranked by `findRecipesFromPantry`. **Recipe detail**: times, servings, ingredients, steps, a link to the source, similar recipes. The dock's background is Liquid Glass on iOS 26+, a blur on older iOS and on Android 12+, and a plain translucent bar on older Android. Bookmarks is in the dock but disabled (half opacity, "coming soon" for screen readers) until saved recipes exist. The look follows the Claude Design board "RecipeMaker — Current Mockup", with its fonts (Lora, Nunito Sans, Caveat) and its line icons. Board parts with no data or service rule behind them yet (ingredient categories, units on pantry quantities, photos, swaps, readiness filters and pills, favorites, a pantry saved between launches) are left out; the recipe banner is a tinted placeholder with an icon instead of a photo. Board screens not built yet: Full Recipe (Ingredients and Steps tabs), Cook Mode, Mark as Cooked, and Bookmarks. The `searchRecipesByIngredient` and `filterRecipes` services and the `scaleIngredients` domain rule are tested but no screen uses them yet.
- **Platform:** Expo Go (Android and iOS)
- **Language(s):** Typescript
- **Frameworks:** React Native 0.86 with React 19.2, Expo SDK 57 (managed workflow: the `ios/` and `android/` folders are git-ignored and never committed), Expo Router for navigation (one file per route in `app/`), `react-native-svg` for icons, `expo-glass-effect` (Liquid Glass) and `expo-blur` for the dock's background, `expo-font` with `@expo-google-fonts/lora`, `nunito-sans` and `caveat` for the mockup's fonts
- **Setup:** Node.js 22.13 or later, then `npm install`. Node 23 is outside what `react-native` 0.86 supports (24.3+ is fine), and the integration tests need `node:sqlite` without a flag, which arrived in Node 22.13.
- **Environment variables:** none are used yet (no `process.env` reads). If you add any, put them in `.env.local`: `.gitignore` excludes `.env*.local` files, but not a plain `.env`.
- **Data storage:** SQLite on the device via `expo-sqlite` (not the Node `sqlite3` package, which does not run in Expo Go). Only files in the Data Access layer (`src/data/`) may import `expo-sqlite`.
- **Adding dependencies:** use `npx expo install <package>` so the version matches the Expo SDK. Never pass `--force` or `--legacy-peer-deps` to get past an `ERESOLVE` error: they install versions the SDK does not support, and the breakage shows up later (failed tests, crashes in Expo Go). The usual cause is a peer dependency that npm installed at its latest version; fix it by pinning that package with `npx expo install <peer>`. This is why `react-dom`, `react-native-reanimated`, `react-native-worklets` and `react-native-gesture-handler` are listed in `package.json` even though no app code imports them: `expo-router` and the packages it pulls in need them as peer dependencies (`react-native-worklets`, for example, is required by `react-native-reanimated`), so do not remove them.
- **Test framework(s):** Jest 29 with the `jest-expo` preset, configured in the `jest` block of `package.json`. Its `testMatch` only finds `tests/**/*.test.ts(x)`, so test files go under `tests/` (a test next to its source file would never run). Component and screen tests render with `react-test-renderer` (installed by `jest-expo`, not listed in `package.json`) through the `render()` and `shownText()` helpers in `tests/support/render.tsx`. Data-layer integration tests run the real SQL against `assets/data/recipes.db` using Node's built-in `node:sqlite` (see §5.2), because `expo-sqlite` only runs on a device.
- **Command to run the app:** `npm run start` starts the Expo dev server (Metro); scan the QR code with Expo Go, or press `a`/`i` to launch on Android/iOS. `npm run android` / `npm run ios` start it targeting one platform directly. If the phone is not on the same network as the PC, use `npx expo start --tunnel` (needs the `@expo/ngrok` dev dependency, which Expo CLI only finds in the project's `node_modules`, not as a global install). `npm run web` (and `w`) also exist, but web is not set up: `react-native-web` is not installed, and adding it is a new dependency (ask first).
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
├── (tabs)/                  #   the tab screens, under the bottom dock (the group name is not in the URL)
│   ├── _layout.tsx          #   headless tabs (expo-router/ui): screens in a BlurTargetView, DockBar after it
│   ├── index.tsx            #   "/"                    → PantryScreen
│   └── recipes.tsx          #   "/recipes"             → RecipesScreen
├── results.tsx              #   "/results?pantry=[…]"  → ResultsScreen        (outside the tabs: no dock)
└── recipe/[id].tsx          #   "/recipe/42"           → RecipeDetailScreen   (outside the tabs: no dock)
app.json                     # Expo config under the `expo` key: app name, icons, scheme, plugins
assets/data/recipes.db       # Bundled, read-only recipe database (see §5.2)
metro.config.js              # Adds 'db' to Metro's assetExts so require() can load recipes.db
package.json                 # Scripts, dependencies, "main": "expo-router/entry", and the Jest config
tsconfig.json                # Extends expo/tsconfig.base: strict, "jsx": "react", Jest and Node types
src/
├── domain/                  # BUSINESS: recipe types, RecipeRepository interface, errors,
│                            #   staples list, search-term normalization, serving scaling,
│                            #   pantry list rules (no repeats, quantities from 1 to 99)
├── services/                # BUSINESS: one use case per file (search, pantry match, filter,
│                            #   recipe detail, similar recipes, ingredient suggestions,
│                            #   ingredient lookup, the full recipe list A to Z)
├── data/                    # DATA ACCESS: SqliteRecipeRepository (all recipe queries), row mappers,
│                            #   SqlDatabase interface, data version check, openRecipeDatabase
├── ui/
│   ├── screens/             # PRESENTATION: full pages (PantryScreen, RecipesScreen, ResultsScreen,
│   │                        #   RecipeDetailScreen)
│   ├── components/          # PRESENTATION: props-only pieces used by screens and layouts (recipe card,
│   │                        #   buttons, suggestion list, pantry row, step, source card, state message,
│   │                        #   Icon, DockBar and DockItem for the bottom dock)
│   ├── format/              # PRESENTATION: pure display functions (fractions, plurals, ingredient
│   │                        #   lines, ingredient-name capitals, times, servings, yield, source,
│   │                        #   counts, tagline, suggestion highlighting)
│   ├── navigation/          # PRESENTATION: routeParams — screen data to route params and back
│   ├── platform/            # PRESENTATION: dockSurface — which dock background this device can draw;
│   │                        #   dockLayout — the dock's distance from the bottom and the room screens leave for it
│   ├── AppFontsGate.tsx     # Loads the mockup's fonts; holds the app back until they load (or fail)
│   ├── RecipeServicesContext.tsx  # Starts the services once; route files get them via useRecipeServices()
│   └── theme.ts             # PRESENTATION: colors, spacing, radii, font sizes, font families,
│                            #   shadows, and the dock's size and clearance, from the mockup
├── createRecipeServices.ts  # Binds services to a repository; the object the UI calls
└── main.ts                  # Composition root: startRecipeServices() opens the database and
                             #   wires SqliteRecipeRepository into the services
tests/
├── unit/                    # Services and domain rules, using fakes (no database)
├── integration/             # SqliteRecipeRepository, the data version check, and acceptance checks (known
│                            #   recipe counts and search results) run through the real services against recipes.db
├── ui/                      # Presentation tests, mirroring src/ui/: format/, screens/, components/,
│                            #   navigation/, platform/, RecipeServicesContext, AppFontsGate (screens use mocked
│                            #   RecipeServices; AppFontsGate mocks expo-font)
├── app/                     # Route files, with expo-router mocked; recipe/id.test.tsx tests
│                            #   app/recipe/[id].tsx and tabs/ tests app/(tabs)/ (no brackets or parentheses:
│                            #   Jest path patterns treat them as special)
├── fakes/                   # InMemoryRecipeRepository, makeRecipe(), makeIngredient()
└── support/                 # nodeSqliteDatabase (SqlDatabase adapter over node:sqlite), render() and
                             #   shownText() helpers, react-test-renderer type declarations
```

### 5.2 Project-Specific Rules

- **Only `src/data/openRecipeDatabase.ts` imports `expo-sqlite`.** Repositories depend on the small `SqlDatabase` interface in `src/data/SqlDatabase.ts` instead. expo-sqlite's `SQLiteDatabase` satisfies it on the device; `tests/support/nodeSqliteDatabase.ts` satisfies it in tests.
- **The UI gets services, never a database or repository.** `app/_layout.tsx` wraps the app in `RecipeServicesProvider`, which calls `startRecipeServices()` once and shows a loading or error message until the services are ready. Route files in `app/` get the object with `useRecipeServices()` and pass it to their screen as the `services` prop (type `RecipeServices`). Do not use `SQLiteProvider` or `useSQLiteContext()` in components.
- **Rules live in services, not SQL.** Repository methods are plain lookups (by id, by ingredient, by alias, lists). Decisions such as which ingredients count as missing, what "serves N people" means, ranking order, and result limits belong in `src/services/` or `src/domain/`, where they are unit-tested with `InMemoryRecipeRepository`.
- **Screens go in `src/ui/screens/`, reusable components in `src/ui/components/`.** A screen is a full page the user navigates to; a component is a piece used by one or more screens. Both are `.tsx` files and follow the Presentation layer rules in §3.1.
- **Screens call services; components get data through props.** Only screens call `RecipeServices` (route files only hand it over), and screens own the loading and error states. Components never call services. They receive the data to show (e.g. a `RecipeSummary`) and callbacks for user actions (e.g. `onPress`) as props, so they can be tested by rendering them with plain values and reused on any screen.
- **Route files stay thin.** Each file in `app/` gets the services, reads its route params, renders one screen from `src/ui/screens/`, and turns the screen's callbacks (`onFindRecipes`, `onOpenRecipe`, `onBack`, ...) into `router` calls. Screens never import `expo-router`, so their tests need no router. Route params are always strings: convert them with the tested helpers in `src/ui/navigation/routeParams.ts` (the pantry list travels as JSON; recipe ids go through `recipeHref` and `recipeIdFromParam`). "Back to pantry" and "Return to Pantry" use `router.dismissTo('/')`, which closes the screens over the tabs and switches to the Pantry tab, with its list still there. Route files are tested in `tests/app/` with `jest.mock('expo-router')`.
- **Styling comes from `src/ui/theme.ts`.** Take colors from `theme.colors` instead of writing hex values, and use its spacing, radius, font-size and shadow names where one fits. Set text weight with `fontFamily: fonts.<weight>` (`regular`, `semibold`, `bold`, `heavy`; `heading` for Lora headings, `handwritten` for Caveat), never `fontWeight`: a custom font picks its weight by family name, and every `Text` style needs a `fontFamily` because React Native has no app-wide default font. A new font weight must also be added to `AppFontsGate`. Icons come from `src/ui/components/Icon.tsx`, which copies the board's 24×24 SVG shapes; add a new icon there rather than drawing SVG in a screen.
- **The bottom dock belongs to `app/(tabs)/`.** A screen gets the dock by having its route file in `app/(tabs)/` and a `TabTrigger` in `app/(tabs)/_layout.tsx`; screens that open over the tabs (Results, Recipe detail, and future ones like Cook Mode) stay outside the folder so the dock is hidden. The layout uses the headless tabs from `expo-router/ui` (not `Tabs` or `NativeTabs`) because the Android blur needs the screens inside a `BlurTargetView` and the dock outside it. `TabTrigger`s must be direct children of `DockBar` with `asChild`, or the tabs won't find them. The root layout's safe area pads only the top: tab screens run to the bottom edge, and every other stack screen gets the bottom inset as padding (`contentStyle` in `app/_layout.tsx`). The dock sits `dockOffset(insets.bottom)` from the bottom (the board's 24 px, or just above the home indicator), and floats over the screens, so a tab route passes `dockClearance(insets.bottom)` to its screen as `bottomClearance` and the screen leaves that much room at the bottom of its content. Both functions are in `src/ui/platform/dockLayout.ts`. Which background the dock draws (Liquid Glass, blur, Android blur, translucent) is decided by the tested `src/ui/platform/dockSurface.ts`; `DockBar` only draws the one it is given.
- **Display text lives in `src/ui/format/`.** Business and data code return raw values (numbers, booleans, singular names); pluralizing, fractions, "≈" markers and joined strings are presentation.
- **`recipes.db` is read-only.** It is copied over the device copy on every launch (`forceOverwrite: true`), so never write user data to it and never enable WAL on it. User data (favorites, pantry) goes in a separate database that references recipes by `recipe_id`.
- **Updating the recipe data:** replace `assets/data/recipes.db`, bump its `PRAGMA user_version`, and bump `RECIPE_DATA_VERSION` in `src/data/recipeDataVersion.ts` to match. Keep existing `recipe_id` values stable and never reuse a deleted ID.
- **The entry point is `expo-router/entry`.** `package.json`'s `"main"` points to it. It builds the app from the `app/` folder and then calls `registerRootComponent` from `expo` rather than a plain `AppRegistry.registerComponent` call; this is what makes the same entry work in both Expo Go and native builds. There is no `index.ts` or `App.tsx`: the app shell is `app/_layout.tsx`, and `app/(tabs)/_layout.tsx` adds the dock.
- **Device-only files** (`src/data/openRecipeDatabase.ts`, `src/main.ts`, `app/_layout.tsx`) cannot run under Jest. Keep them to wiring only, and put any logic they need in a separate, tested piece (as with `assertRecipeDataVersion`, `RecipeServicesProvider` for the layout's loading and error states, and `AppFontsGate` for font loading).
- **Each source file names its layer.** Files in `src/` (and some in `app/`) start with a comment that says which layer they belong to and what they do, e.g. `// BUSINESS LAYER: ingredient autocomplete.` or `// PRESENTATION LAYER (route "/"): …`. Start new files the same way.
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
