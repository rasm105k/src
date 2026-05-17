# Workslip PWA

## Purpose

This application is the employee-facing PWA used to create and submit work reports and documentation from the field.

The app is primarily used by technicians, installers and service employees to fill out workslips and submit operational documentation directly to the platform.

Submitted reports are processed and become available inside the Backoffice application.

---

## Relationship to Backoffice

The PWA and Backoffice are tightly connected.

All report fields created in the PWA must also exist in the Backoffice system.

This means:
- Field names should remain consistent across applications
- Data structures should stay aligned
- Changes to report schemas must consider both apps
- New report fields introduced in the PWA must also be supported in Backoffice workflows and views

The PWA is the data-entry layer.
The Backoffice is the operational and administrative layer.

---

## Tech Stack

- Next.js
- React
- TypeScript
- PWA support
- Vercel

---

## Design Principles

This application is designed for fast usage in the field.

The UI should therefore prioritize:
- speed
- clarity
- low friction
- mobile usability

The interface should remain simple and focused even when forms become large.

When implementing features:
- Follow the existing design language
- Reuse components whenever possible
- Keep interactions intuitive for non-technical users
- Avoid unnecessary complexity
- Ensure forms are easy to complete on mobile devices

---

## UX Principles

Field workers are often:
- busy
- under time pressure
- wearing gloves
- working outdoors
- using phones/tablets

Therefore:
- Important actions must be obvious
- Inputs should be large and easy to use
- Form flows should minimize friction
- Validation should be clear and forgiving
- Reduce unnecessary typing whenever possible

---

## Code Quality

Contributors should:
- Prefer reusable form components
- Keep report schemas centralized where possible
- Avoid duplicate field definitions between apps
- Remove unused code when appropriate
- Keep the codebase modular and maintainable

---

## Product Context

The wider platform focuses on AI-assisted document handling and operational workflows for Danish installation and service companies.

The PWA replaces or supplements handwritten documentation by allowing employees to submit structured operational data directly from the field.

Typical workflows include:
- workslips
- KLS documentation
- service reports
- installation reports
- completion reports
- image uploads
- signatures
- operational notes

The submitted data is later reviewed and managed inside the Backoffice application.