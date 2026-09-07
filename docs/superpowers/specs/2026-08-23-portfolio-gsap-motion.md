# Portfolio GSAP motion (mixed)

Date: 2026-08-23  
Status: approved

## Goal

Add free GSAP + ScrollTrigger animations to the public portfolio only. Mixed feel: strong on hero + callout; subtle fade/rise elsewhere. Respect `prefers-reduced-motion`.

## Non-goals

- Admin UI motion
- Club GreenSock plugins (SplitText, etc.)
- Scroll-scrubbed storytelling beyond existing hero scrub

## Approach

- `gsap` + `ScrollTrigger` via yarn
- Custom word/line split for hero headline + callout lines
- Client root `PortfolioMotion` with `gsap.context` cleanup
- `data-motion` markers on sections / elements
- `once: true` on scroll reveals

## Section map

| Area | Motion |
|------|--------|
| Nav | Fade in on load |
| Hero | Word stagger + CTAs + media scale |
| Callout | Lines from sides; accent fade in |
| About / cases / featured / experience / clients / footer | Fade + short y; light stagger on cards |

## Reduced motion

Skip timelines; leave elements at final opacity/transform.
