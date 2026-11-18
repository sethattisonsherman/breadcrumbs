---
name: Constellations
description: A quiet midnight learning space where completed lessons become stars.
colors:
  night: "#080d18"
  ink: "#edf0f6"
  muted: "#a8b5ca"
  moonlight: "#b9d3ef"
  star: "#e0eafa"
  dialog: "#0c1422"
  notice: "#162135"
  divider: "#a8b5ca29"
typography:
  display: { fontFamily: "Manrope, sans-serif", fontSize: "clamp(1.8rem, 3.3vw, 2.8rem)", fontWeight: 450, lineHeight: 1.4, letterSpacing: "-0.035em" }
  body: { fontFamily: "Manrope, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.9, letterSpacing: "normal" }
  label: { fontFamily: "Manrope, sans-serif", fontSize: "0.85rem", fontWeight: 400, lineHeight: 1.7, letterSpacing: "normal" }
  survey-option: { fontFamily: "Manrope, sans-serif", fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", fontWeight: 400, lineHeight: 1.7 }
  button: { fontFamily: "Manrope, sans-serif", fontSize: "0.9rem", fontWeight: 400 }
  curiosity: { fontFamily: "Manrope, sans-serif", fontSize: "clamp(1.4rem, 2.6vw, 2.1rem)", fontWeight: 400, letterSpacing: "-0.02em" }
  feedback: { fontFamily: "Manrope, sans-serif", fontSize: "0.82rem", fontWeight: 400 }
rounded: { square: "0px", subtle: "2px", control: "3px", circle: "50%" }
spacing: { xs: "8px", sm: "16px", md: "24px", lg: "40px", xl: "64px" }
components:
  survey-choice: { backgroundColor: "transparent", textColor: "{colors.muted}", typography: "{typography.survey-option}", rounded: "{rounded.square}", padding: "10px 16px", height: "48px" }
  text-button: { backgroundColor: "transparent", textColor: "{colors.muted}", typography: "{typography.button}", rounded: "{rounded.square}", padding: "8px 0", height: "44px" }
  open-input: { backgroundColor: "transparent", textColor: "{colors.moonlight}", typography: "{typography.curiosity}", rounded: "{rounded.square}", padding: "10px 48px", height: "62px" }
  feedback-choice: { backgroundColor: "transparent", textColor: "{colors.muted}", typography: "{typography.feedback}", rounded: "{rounded.control}", padding: "10px 14px", height: "44px" }
  history-row: { backgroundColor: "transparent", textColor: "{colors.ink}", typography: "{typography.button}", rounded: "{rounded.square}", padding: "15px 2px", height: "70px" }
---

# Design System: Constellations

## Overview

**Creative North Star: "A lesson becoming a star"**

The interface is a sparse midnight sky for self-directed learning. Manrope and pale text sit directly in open space, with fine stars giving the dark field depth. The survey, curiosity prompt, and lesson activity each take the center of attention in turn. Questions fade between situations; a learner writes into open space; completed work contracts into a star before its summary appears. The sky records completed effort as a revisitable constellation. Keep content unboxed where the current surface uses open text; panels are reserved for dialogs and notices.

**Key Characteristics:**
- Sparse centered composition, midnight blue, fine stars.
- Unboxed choices and open-space writing.
- Pale blue focus, restrained fades, lesson-to-star completion.

## Colors

Near-black blue sky, soft cool text, and restrained moonlight blue accents.

### Primary
- **Moonlight blue** (`{colors.moonlight}`): Focus, active lesson emphasis, and home curiosity input.

### Secondary
- **Fine star** (`{colors.star}`): Small points of light across the sky.

### Neutral
- **Midnight sky** (`{colors.night}`): Main application and starfield background.
- **Soft ink** (`{colors.ink}`): Primary text and headings; **Distant text** (`{colors.muted}`): Supporting copy and quiet controls.
- **Dialog night** (`{colors.dialog}`) and **Notice blue** (`{colors.notice}`): Distinct dialog and notice surfaces; **Quiet divider** (`{colors.divider}`): History separators.

**The Sky-First Rule.** Keep the night field dominant; use moonlight blue to direct attention rather than decorate every control.

## Typography

**Display Font:** Manrope (sans-serif fallback)  
**Body Font:** Manrope (sans-serif fallback)  
**Label/Mono Font:** Manrope; step counts use tabular figures.

**Character:** Clean and calm, with softly weighted headlines and readable long-form lesson text. Keep sentence case and restrained tracking.

### Hierarchy
- **Display** (450, `clamp(1.8rem, 3.3vw, 2.8rem)`, 1.4 line-height, -0.035em): Main and lesson headings.
- **Headline** (450, `clamp(1.6rem, 3.1vw, 2.35rem)`, 1.4): Centered survey question.
- **Title** (550, 1.1rem, 1.6): Activity and section headings.
- **Body** (400, 1rem, 1.9): Lesson prose; contextual text caps near 65ch.
- **Label** (400, 0.82–0.95rem): Controls and supporting detail.

## Layout

Survey and home prompt center in the viewport. Survey shows one question with its choices in a container up to 680px wide (32px desktop gutters, 24px mobile). Lesson, summary, and subject history use a readable left-aligned column with generous breathing room. Constellations spread around home in three columns, switching to two at 650px and below. Controls retain 44px minimum touch targets.

## Elevation & Depth

Flat by default, with no ambient shadows. Depth comes from the starfield, sparse contrast, and restrained surface changes. Dialog and notice use distinct dark tonal surfaces with fine borders; ordinary survey and lesson content stay open.

**The Open-Space Rule.** Text and choices sit directly on the sky unless the interface is an actual dialog or notice.

## Shapes

Most surfaces and fields are square and borderless. Circles are for the submit control and star points; feedback choices use a subtle 3px corner. Divider lines and focus outlines stay light and precise.

Component height tokens describe minimum control heights; multiline content can grow naturally.

## Components

### Buttons
- **Character:** Quiet text controls; color and focus communicate interaction. Most are borderless and square; submit is circular.
- **Action:** Moonlight blue text, 44px target, restrained tonal hover; quiet controls shift from muted to soft ink.
- **Feedback:** Thin muted border; selected response uses soft ink, moonlight border, and faint blue wash.

### Inputs / Fields
- **Home curiosity:** Transparent, centered open-space field; moonlight text and caret, no resting border. Focus adds a faint short underline.
- **Lesson response:** Transparent multiline field with a fine bottom rule and moonlight caret; resize vertically. Keyboard focus remains visible.

### Signature Component: Survey Question
One centered question and vertical text choices, one situation at a time. Choices have generous targets without an enclosing card; questions fade between situations.

### Signature Component: Lesson Star
At completion the lesson contracts to one small star, then the summary fades in. The star appears in the subject constellation and opens revisitable lesson history.

## Do's and Don'ts

### Do:
- **Do** keep each survey view to one centered question and its choices.
- **Do** preserve the transparent home input, keyboard focus, and reduced-motion support.
- **Do** let each completed lesson become one star in its subject constellation.

### Don't:
- **Don't** add survey headers, meters, panels, or prepopulated constellations.
- **Don't** put ordinary lesson and survey content in cards.
- **Don't** use streak penalties or imply that stars certify mastery.
