---
version: 1
slug: "client-src-main-jsx"
primary_target: "client/src/main.jsx"
related_targets: ["client/src/styles.css"]
---

# Learning journey

Scope: survey, home sky, lesson, completion summary, subject history. Mode: Operate. Adults learning independently. User confirmed the complete flow and publication target on 2026-11-18.

## Direction contract

THESIS: One question or activity occupies the learner's attention; completed work becomes a persistent, revisitable sky.

OWN-WORLD: Midnight blue space and fine, warm white stars. Clear, unboxed text controls, a transparent text field, pale blue focus rings, ample space. Retain the existing Manrope typography while reducing interface chrome.

STORY: Choose what feels natural in six untimed situations, express a curiosity, work through three adapted activities, complete the lesson, see it become a star, read the summary, and return to a growing subject constellation.

FIRST VIEWPORT: Only a centered question and its four text choices over stars on the survey. Home centers “What do you want to learn?” above an unboxed field. Constellations occupy the surrounding space after completion. A small submit arrow appears with text. Signature interaction: the lesson contracts into a single star before the summary fades in. Fades last 320ms; completion lasts 1000ms. Reduced motion uses immediate scene changes and a brief static completion state.

FORM: seed: none (pinned). User: “nothing on the screen other than stars in the background, survey questions and options fading in and out, one at a time, in the middle of the screen.” “Main view simply has 'What do you want to learn?' in the middle” with typing “into open space.”

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

No survey header, panels, navigation, meters, mascots, or prepopulated constellations. Native input semantics, keyboard focus, clear submission, reduced motion, and mobile layout remain functional. Preserve prior data and CAPTCHA. One star equals one completed lesson. No generated raster assets required.
