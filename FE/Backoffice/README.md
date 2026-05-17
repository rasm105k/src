# Backoffice

## Purpose

This application is the administrative frontend for the platform.

The backoffice is used by administrators and office staff to manage the system as a whole. It is the central place where processed reports and extracted document data are submitted, reviewed and managed.

Core responsibilities:
- View submitted reports
- Search and filter reports
- Review extracted document data
- Manage report states and workflows
- Provide overview and operational insight across the platform

This is a data-heavy internal application focused on efficiency and clarity.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Vercel

---

## Design Principles

The application should follow the existing design system and visual language already established in the project.

When implementing new features:
- Reuse existing components whenever possible
- Prefer composable and reusable UI patterns
- Avoid duplicate UI implementations
- Keep styling and spacing consistent with the existing system
- Follow modern UX and accessibility best practices

Because the application is data-dense:
- Prioritize information hierarchy and readability
- Maximize useful information on screen without creating clutter
- Prefer clean layouts over excessive whitespace
- Tables, filters and overview components should remain efficient and easy to scan
- Important actions and statuses should always be visually clear

---

## Code Quality

Contributors should:
- Clean up unused code where appropriate
- Remove dead components and stale logic
- Keep files modular and maintainable
- Avoid overengineering solutions
- Prefer simple and understandable abstractions

---

## Architectural Notes

The backoffice is intended to evolve into the operational center of the platform.

The frontend should therefore be designed with:
- scalability
- maintainability
- reusable workflows
- structured state management

in mind.

Avoid tightly coupling UI components to specific document formats or workflows when possible.

---

## Product Context

The wider platform focuses on AI-assisted document handling for Danish installation and service companies.

Typical workflows involve:
- handwritten workslips
- KLS documentation
- OCR/Document Intelligence extraction
- AI-cleaned reports
- structured operational data

The backoffice is where this data becomes operationally useful.