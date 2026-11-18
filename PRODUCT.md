# Constellations

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Adult self-directed learners exploring subjects and practical interests.

## Product Purpose

Turn curiosity into a personal sequence of achievable lessons. Completed lessons accumulate as stars in a constellation for each subject.

## Positioning

A survey ranks flexible learning preferences. The application selects a deterministic lesson framework from that ranking and Gemini creates the lesson content within it. Preferences guide presentation and can evolve with feedback; they are not fixed cognitive categories or proof of what produces the best learning outcomes.

## Operating Context

First visit: untimed survey, one centered question and its choices at a time. Home: “What do you want to learn?” and typing in open space. Submit: prompt fades out, lesson fades in. Lessons proceed one activity at a time. Completion: the lesson contracts into a star, then a summary appears. Returning home reveals one new star in the subject constellation. Selecting a constellation continues the subject or revisits completed lessons.

## Capabilities and Constraints

- Rank hands-on practice, worked examples, reading/reflection, and explaining aloud. The user approved situational survey questions and refining preferences through lesson feedback.
- Retain existing browser progress and the optional Node/PostgreSQL backend. GitHub Pages uses browser-local progress and the existing authenticated Supabase Gemini function.
- Keep API keys and service credentials out of browser bundles. Preserve the current anonymous-session and CAPTCHA integration.
- User authorized pushing tested changes to main and publishing the GitHub Pages testing site.
- Stars represent completed lessons and effort, not certified mastery. No streak penalties.

## Brand Commitments

Constellations. A star field, open space, centered questions, fading transitions, and the lesson-to-star completion moment. The Pottermore Patronus test is the user's reference for simplicity, not for copied assets.

## Product Principles

- One decision or activity in focus at a time.
- Make learning adaptation operational in the lesson-generation contract.
- Preserve progress and make previous lessons available.
- Keep completion meaningful: no subject star until its first completed lesson.

## Evidence on Hand

Existing React/Vite app, PostgreSQL state API, Supabase Gemini function, and GitHub Pages publishing workflow. User reference: https://www.youtube.com/watch?v=4jTMGnALzwM. The video page was accessible only as metadata; no claim of watching its content.
