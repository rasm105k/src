# Call Assistant POC

## Purpose

This bot is a proof of concept for an AI assistant that helps Danish service and installation companies extract useful notes from phone calls.

The goal is not to build a live phone agent yet.

The goal is to test whether AI can understand a recorded/transcribed conversation and turn it into useful operational output.

## Core Idea

Many service companies receive important information through phone calls.

Examples:
- customer requests
- service appointments
- addresses
- follow-up tasks
- missing parts
- changes to existing jobs
- calendar agreements

Today, this information is often remembered manually, written down loosely, or forgotten.

This bot should help by turning a call recording into structured notes.

## Assume
Language: Danish
Context: Danish service/installation company

## Success Criteria
What was agreed?
Who should do what?
When should it happen?
Is anything unclear?



## MVP Flow

```text
Audio file
↓
Speech-to-text
↓
AI analysis
↓
Structured JSON
↓
Human review