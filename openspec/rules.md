# Coding Standards and Rules

## Overview
This document establishes the baseline coding standards, naming conventions, and best practices for the StrayCare project.

## General Principles
- **Modularity**: Break down complex logic into smaller, reusable functions or components.
- **Readability**: Code should be self-documenting. Use clear, descriptive names over short, cryptic ones.
- **Consistency**: Follow the established conventions throughout the entire codebase.

## Naming Conventions
- **Files & Directories**: Use `kebab-case` or `snake_case` for configuration files. Use `PascalCase` for React components (`Component.jsx`).
- **Variables & Functions**: Use `camelCase`.
- **Classes & React Components**: Use `PascalCase`.
- **Constants & Environment Variables**: Use `UPPER_SNAKE_CASE`.

## Frontend Rules (React & Vite)
- **State Management**: Use Zustand for global state. Avoid prop-drilling for deeply nested data.
- **Hooks**: Follow standard React hook rules. Only call hooks at the top level and from React functional components.
- **API Calls**: Centralize Axios instances to apply common headers or interceptors.
- **Imports**: Group imports logically (e.g., built-in, third-party libraries, local components, styles).

## Backend Rules (Express & Node.js)
- **Error Handling**: Use centralized error handling middleware. Never leave unhandled promise rejections. Return consistent JSON error formats.
- **Async/Await**: Prefer `async/await` over raw `.then().catch()`.
- **Database Access**: Use Prisma exclusively for database queries. Keep complex business logic out of controllers—place it in dedicated service modules if applicable.
- **Security**: 
  - Never commit secrets (API keys, database URLs); always use `.env`.
  - Validate and sanitize all incoming request bodies.
  - Apply rate limiting middleware to sensitive routes (e.g., auth routes).

## Git and Workflow (SDD Methodology)
- Follow the Spec-Driven Development (SDD) methodology: Update `openspec` documentation before writing feature code.
- Always use the "Propose -> Apply -> Archive" workflow for major features.
- Commit messages should be clear, descriptive, and reference any relevant spec documents or issue tickets.
