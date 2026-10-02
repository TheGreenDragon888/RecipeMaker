# Recipe Maker

## Team Members
- Isaac Day
- Enoch Romero

## Software Description

RecipeMaker is a mobile app for Android and iOS, built with React Native and Expo and run through Expo Go. You enter the ingredients you already have, and the app finds recipes you can make with them. Results are ranked by how few extra ingredients you would need to buy, and you can narrow them with filters such as hands-on cooking time and number of people.

The app ships with a bundled, read-only recipe database (130 recipes, 269 distinct ingredients, and 698 ingredient aliases), so it works fully offline. Aliases let searches match the way people actually type: for example, "Chick Peas" finds recipes that list "chickpeas".

## Architecture

RecipeMaker uses a **three-tier architecture**. Dependencies point downward only, so each layer can be tested on its own.

```
┌─────────────────────────────────────────┐
│  PRESENTATION   src/ui/                 │  Screens, components, display formatting
└───────────────────┬─────────────────────┘
                    │ calls RecipeServices
┌───────────────────▼─────────────────────┐
│  BUSINESS LOGIC src/domain/, services/  │  Recipe rules, ranking, filtering, scaling
└───────────────────┬─────────────────────┘
                    │ through the RecipeRepository interface
┌───────────────────▼─────────────────────┐
│  DATA ACCESS    src/data/               │  SQLite queries and row mappers
└─────────────────────────────────────────┘
```

| Layer | Folder | What it contains |
|---|---|---|
| Presentation | `src/ui/screens/`, `src/ui/components/` | Screens that call services and manage loading and error states, plus reusable components that receive data through props |
| Presentation | `src/ui/format/` | Pure display functions: fractions, plurals, ingredient lines, times, servings |
| Business | `src/domain/` | Recipe types, the `RecipeRepository` interface, domain errors, the kitchen staples list, search-term normalization, serving scaling |
| Business | `src/services/` | One use case per file: search by ingredient, match a pantry, filter, recipe detail, similar recipes, ingredient autocomplete |
| Data Access | `src/data/` | `SqliteRecipeRepository` (all SQL lives here), row mappers, a data-version check, and the code that opens the database |
| Composition root | `src/main.ts`, `src/createRecipeServices.ts` | Opens the database at startup and wires the repository into the services the UI uses |

**Data storage:** recipes live in `assets/data/recipes.db`, an SQLite database bundled with the app and opened on the device with `expo-sqlite`. Only the data layer touches the database. The UI only ever sees the `RecipeServices` object.

**Testing:** the project is developed test-first with Jest (`jest-expo` preset).
- `tests/unit/`: business rules tested against an in-memory fake repository
- `tests/integration/`: the real SQL run against `recipes.db` using Node's built-in `node:sqlite`
- `tests/ui/`: display formatting and screens rendered with mocked services

## Software Features
* [x] Search for recipes by a single ingredient, with alias-aware matching and a partial-match fallback
* [ ] "What can I make?": enter your pantry and see recipes ranked by fewest missing ingredients (common staples such as salt, pepper and oil are never counted as missing)
* [ ] Filter recipes by maximum hands-on time and number of people
* [ ] Ingredient autocomplete while typing
* [ ] Recipe detail page with the full ingredient list
* [ ] Scale ingredient amounts to a different number of people
* [ ] "Similar recipes": the same dish from other sources
* [ ] Estimated cost to buy the missing ingredients
* [ ] Save favorite recipes and your pantry between sessions

*Business logic for the pantry match, filters, autocomplete, recipe detail, scaling and similar recipes is built and tested. Their screens are still in progress.*

## Team Communication

We just text each other, and talk in class, bro.
There's literally two of us, bro.

## Team Responsibility

|Responsibility                      |Team Member(s)              |
|------------------------------------|----------------------------|
|Conducting Meetings                 |Enoch Romero|
|Maintaining Team Assignment List    |Enoch Romero|
|Ensuring GitHub is Working          |Isaac Day|
|Maintaining Documentation           |"Isaac Day"|
|Create & Display Presentations      |"Isaac Day"|
|Submit Team Assignments             |Isaac Day|

## Reflections

<!-- TODO: what went well, what was hard, and what you would do differently. -->

## Setting up dev environment

1. Clone this repo
2. Switch to the repo in the terminal `cd RecipeMaker`
3. Run `npm install` (if this doesn't work, make sure you have [node](https://nodejs.org/en/download/current) installed)

## Testing the app

### First-time setup

1. Install the 'Expo Go' app on your phone
2. Create an Expo account (you can create it through your github account)
3. Log in on your phone
4. Run `npx eas-cli login --browser` in the terminal
5. Log in with your credentials

### Test loop

1. Run `npm run start`
2. Scan the QR code that shows up in the terminal

### Running the tests

- `npm test` runs the whole test suite
- `npx jest <path>` runs one test file, e.g. `npx jest tests/unit/services/filterRecipes.test.ts`
- `npx tsc --noEmit` type-checks the project

## Suggestion for committing changes

1. Create a branch with your changes e.g. `git checkout -b [yourinitials]/[branchname]`
2. Push those changes and publish the branch
3. Create a pull request
4. If it looks good, do 'Squash & merge' (you will have to click the dropdown menu the first time)
5. Delete the branch

Hope you're having a great day! 😊