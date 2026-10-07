---
name: ExamPreparation
description: Hebrew RTL exam study workspace
colors:
  accent: "#2855d9"
  accent-hover: "#2045b4"
  accent-light: "#edf2ff"
  accent-ring: "#b2c3f5"
  bg: "#f5f6f8"
  card: "#ffffff"
  card-subtle: "#f8f9fb"
  sidebar: "#1c2230"
  sidebar-ink: "#f5f7ff"
  sidebar-muted: "#b3bbce"
  nav-selected: "#2d57d3"
  nav-hover: "#272f40"
  nav-ink: "#d9dfed"
  nav-focus: "#b7c9ff"
  ink: "#202637"
  ink-secondary: "#485269"
  muted: "#626d82"
  line: "#e6e9ef"
  line-strong: "#cbd2df"
  ok-bg: "#edf7f1"
  ok-ink: "#216442"
  bad-bg: "#fcf0ef"
  bad-ink: "#a23f37"
  half-bg: "#fff5e5"
  half-ink: "#8b5919"
  stale-bg: "#f1edfa"
  stale-ink: "#685098"
  ok-border-indicator: "#388760"
  half-border-indicator: "#ad7830"
typography:
  headline:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-.025em"
  section-title:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.5
  exam-title:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  question:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  data-small:
    fontFamily: "\"Heebo\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans Hebrew\", Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "14px"
spacing:
  field-gap: "7px"
  control-gap: "6px"
  panel-inline: "24px"
  panel-block: "20px"
  exam-gap: "20px"
  summary-gap: "32px"
  workspace-inline: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.card}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 15px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-ghost:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "8px 15px"
    height: "38px"
  button-ghost-hover:
    backgroundColor: "{colors.card-subtle}"
    textColor: "{colors.ink}"
  input-planning:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
    height: "38px"
    width: "174px"
  subject-navigation:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.nav-ink}"
    rounded: "{rounded.md}"
    padding: "13px 10px"
  subject-navigation-selected:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.card}"
  chip-countdown:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card-exam:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  outcome-success:
    backgroundColor: "{colors.ok-bg}"
    textColor: "{colors.ok-ink}"
    typography: "{typography.question}"
    rounded: "{rounded.sm}"
    height: "32px"
  dialog-subject:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "30px"
    width: "min(480px, 100%)"
---

# Design System: ExamPreparation

## Overview

**Creative North Star: "Graphite navigation and white working surfaces"**

Graphite navigation, a cool light canvas, white working panels, and vivid blue actions define the interface. Heebo carries headings, labels, controls, and study data; compact typography and hairline separators organize the dense workspace.

Hebrew RTL determines alignment and reading order. Numeric dates, scores, and timers remain LTR where needed. Soft outcome washes fill main and sub-question rows, with matching semantic ink for readable study data and text-labeled controls.

**Key Characteristics:**

- Dark right sidebar with a blue selected subject.
- White panels and flat question rows on a cool light canvas.
- Heebo throughout with compact controls and clear keyboard focus.
- Soft semantic row washes with matching ink, text-labeled outcomes, and restrained controls.

## Colors

The frontmatter is normative. The palette uses blue actions and graphite navigation with cool neutral working surfaces.

### Primary

- **Action blue:** primary actions, links, and general keyboard focus; the darker hover tone supplies feedback.
- **Blue wash and ring:** countdowns, selected copy targets, and input or linked-exam focus.
- **Selected navigation blue:** the active subject against the graphite sidebar.

### Secondary

- **Success green:** successful outcomes and high scores.
- **Failure red:** failed outcomes, low scores, and destructive feedback.
- **Partial amber:** partial outcomes, medium scores, and paused timers.
- **Review violet:** retry or stale outcome feedback.

### Neutral

- **Graphite:** sidebar background; pale text and muted labels maintain hierarchy within it.
- **Cool canvas, white, and subtle white:** page background, working panels, and subdued sub-question surfaces.
- **Ink, secondary ink, and muted ink:** primary content, supporting data, and labels.
- **Hairline and stronger line:** row separators and panel or field boundaries.

**The Outcome Color Rule.** Use the shared success, failure, partial, and review washes across the full question row. Tint its supporting data from the matching outcome ink, retain explicit status labels, and leave unattempted rows neutral.

## Typography

**Font:** Heebo with system, Segoe UI, Noto Sans Hebrew, and Arial fallbacks. There is no separate display or monospaced family.

- **Headline:** subject heading; the compact-width fallback reduces it to 26px.
- **Section title:** exam-list heading.
- **Exam title:** editable exam name.
- **Body:** general workspace text.
- **Control:** main actions; ordinary date and number fields use the same size at weight 400.
- **Label and question:** supporting text and inline question controls.
- **Small data:** table headings, dates, timers, and exam metadata.

Tabular figures are used for dates, counts, scores, points, and timers where the existing components specify them. Preserve Hebrew text and LTR numeric strings.

## Layout

Desktop uses an RTL grid with a sticky right sidebar (224px) and a flexible working area. The working area is at most 1500px wide with 26px top, 40px inline, and 72px bottom padding. At widths 1101–1359px the sidebar is 208px and inline workspace padding is 32px; at 1100px and below these become 200px and 28px.

Panels use compact internal spacing; planning fields wrap with an 18px gap. The study summary uses equal columns separated by a hairline with a 32px gap. Exam panels use an auto-fit grid with a 480px minimum column and a 20px gap, naturally moving to one column when space is insufficient.

Existing fallbacks move navigation above the workspace at 800px and reorganize controls at 580px. Desktop is the supported design-review priority; phone refinement is deferred.

## Elevation & Depth

Working panels and question groups are flat at rest and on hover. Surface contrast, borders, and separators provide structure. Dialogs use the modal shadow and a dark translucent scrim without background blur.

**The Flat Workspace Rule.** Use surface contrast and hairline borders for workspace structure; reserve substantial elevation for dialogs.

## Shapes

Controls are rectangular with small corners; subject navigation and countdowns use medium corners; outer planning, exam, and dialog panels use large corners. Small metadata badges retain 4–5px corners. Circular status dots are indicators, not navigation containers.

## Components

### Buttons

Primary buttons are blue with white text; hover darkens the background. Ghost buttons are white with a stronger hairline and secondary ink; hover uses the subtle surface. Both use small corners, 38px minimum height, and a 2px blue keyboard outline offset by 3px. Disabled primary actions use 50% opacity.

### Inputs / Fields

Planning dates are 174px wide and 38px high; count fields are 84px wide. White fields have a stronger border, small corners, and 6px 10px padding. Dates read LTR. Focus adds a 2px blue ring with 1px offset. Question fields are 32px high; date and point fields remain transparent until hover or focus.

### Navigation

Subject rows occupy the graphite sidebar. Selection fills the whole row, including the settings button, with navigation blue. Hover and keyboard focus tint the whole row: lighter graphite for unselected subjects and darker blue for the selected subject. The settings button adds a subtle light hover surface within the row. Row spacing stays the same across selection states. The subject name wraps, with the exam count on a second line. A sliders button opens subject options. Selection and options remain independent controls. Sidebar keyboard focus uses a pale blue 2px outline with 2px offset.

### Chips

The countdown uses blue ink on a blue wash with medium corners and 12px 16px padding. Today uses success colors; past dates use muted ink and the neutral line surface. Metadata counts and choice labels stay compact.

### Cards / Containers

Exam panels are white with large corners, clipped content, and a stronger border. Hover only strengthens the border. A compact numeric index accompanies the editable title. The due-date line keeps its date neutral and shows the relative deadline in a semantic badge. A subtle full-width strip groups score, answered count, and total time above the question table. Question groups use large rounded outer corners with an 8px gap between groups and hairline separators only between their nested rows. Main and sub-question rows share the outcome wash when attempted; unattempted sub-questions use the subtle neutral surface. The number column reserves space for the subquestion tree, Hebrew label, attempt badge, and retry action; longer label/action combinations wrap inside that column. Compact cards reserve column widths for complete status labels and native dates. The list heading carries the add-exam action.

### Question outcomes

The complete row uses the existing success green, failure red, partial amber, or review violet wash. Dates, points, timers, and question labels use the corresponding semantic ink. Editable date and point fields retain fine borders, and rows have consistent spacing. On narrow layouts the outcome wash covers the whole wrapped row, including the spaces between cells. Outcome selects retain their text labels and a fine semantic border; timer buttons use white surfaces for a clear affordance. Hover gently deepens the same wash. Unattempted rows stay neutral, and questions excluded from choice scoring retain their existing neutral treatment.

### Study summary and linked exam

Pacing and mastery use equally sized sections with the same heading hierarchy. The next-exam link uses action blue; its destination gets a blue border and ring through the native target state.

### Dialogs

Creation and copy-layout flows use native modal dialogs with labeled headings, white panels, large corners, and modal elevation. The creation panel is at most 480px wide; panel padding is 30px. The background becomes inert while open and focus returns to the launcher on close. Motion is brief: ordinary control color transitions take 160ms, new exam reveals take 200ms, and dialogs enter or exit in 180–240ms. Reduced-motion overrides minimize animation and transition durations.

## Do's and Don'ts

### Do:

- Do preserve Hebrew RTL flow and logical inline spacing.
- Do keep dates, timers, and score strings readable in LTR order.
- Do preserve visible keyboard focus and explicit control labels.
- Do use white panels, soft outcome row washes, and matching semantic ink.
- Do keep subject selection and subject options as separate controls.

### Don't:

- Don't restore the rejected warm-white and deep-green identity.
- Don't use saturated row fills or thick colored outlines around questions.
- Don't use pill-shaped subject navigation or decorative card lift.
- Don't invent logos, imagery, or branding claims.
- Don't replace outcome text with color alone.

Implementation sources: `src/styles/variables.css`, the final overrides in `src/styles/workspace.css`, `src/styles/question-workspace.css`, and the existing base/component styles imported before them. Full preview snippets, focus, motion, and breakpoint extensions live in `.impeccable/design.json`.
