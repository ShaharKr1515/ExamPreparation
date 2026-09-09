---
name: ExamPreparation
description: A personal, high-focus mastery and exam preparation tracker for students.
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-subtle: "#eef2ff"
  neutral-bg: "#f8fafc"
  surface-card: "#ffffff"
  surface-subtle: "#f8fafc"
  surface-alt: "#f1f5f9"
  ink: "#0f172a"
  ink-secondary: "#334155"
  ink-muted: "#64748b"
  border-line: "#e2e8f0"
  border-subtle: "#f1f5f9"
  border-active: "#818cf8"
  ok-bg: "#ecfdf5"
  ok-ink: "#065f46"
  ok-line: "#a7f3d0"
  bad-bg: "#fef2f2"
  bad-ink: "#991b1b"
  bad-line: "#fecaca"
  stale-bg: "#f5f3ff"
  stale-ink: "#5b21b6"
  stale-line: "#ddd6fe"
  warning-bg: "#fffbeb"
  warning-ink: "#92400e"
  warning-line: "#fde68a"
typography:
  display:
    fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: '"Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-exam:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "0"
---

# Design System: ExamPreparation

## Overview

**Creative North Star: "The Focused Scholar's Desk"**

ExamPreparation is a high-density, personal mastery workspace engineered for intensive exam study. The visual environment communicates calm order, laser-sharp clarity, and academic rigor. It rejects decorative clutter, superficial gradients, and playful gamification in favor of purposeful utility, clear contrast, and frictionless micro-interactions.

The interface is tailored specifically for the Hebrew language and RTL direction. Every element—from subject navigation tabs and countdown cadence pills to tabular question matrices—is optically weighted to ensure immediate comprehension of what has been mastered and what requires attention next.

**Key Characteristics:**
- **High-legibility Hebrew typography:** Powered by Heebo with precise optical tracking and tabular figures for numbers and dates.
- **Semantic mastery states:** Emerald for mastered questions, crimson for failed attempts, and iris/violet for stale items requiring spaced repetition.
- **Physical depth and tactile feedback:** Soft, layered ambient shadows with crisp interior borders that provide structure without visual heaviness.
- **Fluid transitions:** Sub-question row expansion and card creation feel physically anchored rather than sudden.

## Colors

A balanced palette anchored by slate neutrals and deep indigo, with high-contrast semantic accents for immediate status recognition.

- **Primary (`#4f46e5`):** Deep indigo used for primary actions, active tab selection, and focused input indicators.
- **Neutrals (`#f8fafc` to `#0f172a`):** Slate tonal scale ensuring comfortable readability during long study sessions.
- **Mastery Tokens:**
  - **Success (`#ecfdf5` / `#065f46`):** Gentle mint-emerald indicating achieved mastery.
  - **Needs Review (`#fef2f2` / `#991b1b`):** Clean rose-crimson indicating a failed attempt.
  - **Stale / Spaced Repetition (`#f5f3ff` / `#5b21b6`):** Dignified violet indicating attempts older than 3 days.

## Typography

- **Primary Font:** Heebo, backed by modern system Hebrew fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).
- **Tabular Figures:** Applied to dates, question indices, points, and interval calculations (`font-variant-numeric: tabular-nums`) to prevent jitter and maintain grid alignment.
- **Hierarchy:**
  - Page Title: 1.75rem / 700 / Tight tracking.
  - Exam Name: 1.05rem / 600 / Centered header.
  - Table Headers: 0.75rem / 600 / Subdued slate.
  - Table Content & Inputs: 0.8125rem / 500 / High-contrast ink.

## Layout

- **Container:** Max-width 1360px centered with generous vertical rhythm (`28px 20px 72px`).
- **Exam Grid:** 2-column responsive layout with 16px gap, collapsing to single column on viewports <= 640px.
- **Directionality:** Native right-to-left (RTL) flow across all components, badges, tabs, and input arrangements.

## Elevation & Depth

- **Card Elevation:** Multi-stop ambient drop shadows:
  `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 6px 18px -4px rgba(15, 23, 42, 0.05);`
- **Active / Focused Elevation:** Inset focus rings hugging rounded corners (`box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2)`).
- **Modals:** Deep focus scrim (`rgba(15, 23, 42, 0.5)` with `backdrop-filter: blur(6px)`) and elevated container (`0 20px 48px -12px rgba(15, 23, 42, 0.25)`).

## Shapes

- **Radius Scale:**
  - `sm` (6px): Form inputs, badges, sub-question chips.
  - `md` (10px): Buttons, controls, dropdown menus.
  - `lg` (14px): Exam cards, modals, empty state containers.
  - `pill` (9999px): Subject tabs, status indicators, counter badges.
- **Borders:** Thin, crisp 1px borders in neutral slate (`#e2e8f0`) to maintain structural separation.

## Components

- **App Header:** Icon badge with subtle primary tint accompanying the clean title and supportive subtitle.
- **Subject Tabs:** Pill-shaped navigation bar with smooth hover background, solid active pill with elevation, and distinct "+ מקצוע חדש" action.
- **Toolbar:** Unified group of pill inputs with integrated labels, custom calendar pickers, and dynamic cadence hints.
- **Exam Card:** Rounded container featuring an editable header, derived due date badge (upcoming, today, overdue), delete action, and question table.
- **Question Table:** Fixed-layout data grid with custom selects, inline date inputs, points controls, and expandable sub-question triggers.
- **Add Exam Card:** Tactile dashed surface with animated hover elevation and rotating action icon.

## Do's and Don'ts

### Do's
- Do maintain RTL alignment and optical spacing in Hebrew throughout.
- Do keep all derived due-date math and cadence indicators dynamic and immediate.
- Do use `tabular-nums` on all numerical and date-bearing elements.
- Do preserve smooth height transitions during sub-question insertion and deletion.
- Do ensure color contrast meets or exceeds WCAG AA (>= 4.5:1 for body and placeholders).

### Don'ts
- Don't add decorative gradient text or unnecessary glassmorphism blurs.
- Don't add heavy colored borders (>1px) to cards or callouts.
- Don't use emoji as system icons.
- Don't hardcode fixed heights that prevent content from expanding cleanly.
- Don't disrupt keyboard tab order or remove visible focus indicators.
