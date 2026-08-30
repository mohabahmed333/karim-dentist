## Dentist Portfolio (Single-Page HTML/CSS) — Design Spec

### Status
- Approved sections: Header/Hero, About/Services, Gallery, Contact/Footer
- Build approach: single static page (no framework) with responsive layout and lightbox modal
- Bilingual update approved: full English/Arabic content with header language switcher

### Goal
Create a fast, easy-to-deploy dentist portfolio that uses the provided branding assets and includes clear navigation and contact actions.

### Brand/Assets
- Logo: `assets/766800441_18084577118253727_1449914596899119909_n.jpg`
- Contact image (for reference/branding): `assets/768432495_18084585374253727_8866675210638190928_n.webp`
- Primary gallery / imagery (suggested):
  - Results / before-during-after: `assets/771453934_18084846845253727_4216909913248468130_n.jpg`
  - Doctor photo: `assets/769385837_18084847031253727_8666198053893142707_n.jpg`
  - Laser/epicX promo: `assets/769375317_18084823622253727_452713876016021475_n.jpg`

### Extracted Contact Details (from OCR)
- Phone/WhatsApp: `+20 111 192 2252`
- Address: `A 41 Ozone Medical Center, New Cairo, Al Narges Buildings`

### Content Sections (Single Page)
1. **Header + Nav**
   - Sticky or top-fixed header with:
     - Left/center logo
     - Nav links: `About`, `Services`, `Gallery`, `Contact`
   - Smooth scrolling behavior to each section id.

2. **Hero**
   - Large title: `The Dental Lounge`
   - Subtitle: `Dr. Karim Elshibiny`
   - Supporting line (text): “Modern laser dentistry with comfort-first care.”
   - Primary CTA buttons:
     - `Call / WhatsApp`:
       - `tel:+201111922252`
     - `Contact`:
       - scroll to `#contact`
   - Theme: cream background with gold accents matching the logo.

3. **About + Services**
   - **About** (2-column on desktop, stacked on mobile)
     - Left: doctor photo (responsive image)
     - Right:
       - Headline: “About The Dental Lounge”
       - 2–3 short lines describing modern laser + cosmetic dentistry focus
       - Small callout box (optional): “Why Laser?” (one-liner)
   - **Services** (grid of cards)
     - Card titles:
       - `Gingivectomy`
       - `Frenectomy`
       - `Teeth Whitening`
       - `TMJ Pain Therapy`
       - `Oral Ulcer Removal`
       - `Perio Pockets Treatment`
       - `Endodontic Treatment`
       - `Oral Surgeries`
     - Each card includes a short 1-line description (to be authored during implementation).

4. **Gallery**
   - Section title: `Gallery`
   - Layout:
     - Featured results image full-width with caption: `Before • During • After`
     - Secondary image row (3 columns on desktop, stacked on mobile):
       - Doctor photo
       - Laser/epicX promo
       - One additional asset image (choose later from `assets/` if available/desired)
   - Interaction:
     - Clicking any gallery image opens a lightbox/modal.

5. **Contact + Footer**
   - Section title: `Contact Us`
   - Contact card:
     - Left:
       - Clinic: `The Dental Lounge`
       - Address: extracted address line
     - Right:
       - `Call` → `tel:+201111922252`
       - `WhatsApp` → link to WhatsApp using the same number (implementation will format URL)
       - Optional: `Get Directions` → Google Maps link built from address
     - Small trust text:
       - “Laser & cosmetic dentistry. Appointments by request.”
   - Footer:
     - Small logo
     - Copyright:
       - `© The Dental Lounge`

### Styling / UX Requirements
- Responsive design for mobile and desktop:
  - Cards grid collapses to fewer columns
  - Nav becomes a simple vertical stack or a compact layout on small screens
- Visual system:
  - Gold accent color and cream background
  - Consistent spacing (8px/16px scale)
  - Rounded corners and subtle shadows for cards
- Accessibility:
  - Ensure sufficient color contrast
  - Images must have meaningful `alt` attributes
  - Buttons/links must be keyboard accessible
  - Lightbox must support closing via `Esc` and click-outside

### Technical Approach
- Files to add:
  - `index.html`
  - `styles.css`
  - `script.js`
  - Use local assets via relative paths: `assets/...`
- No build tooling required.
- Lightbox implemented with minimal vanilla JS.
- Bilingual support implemented client-side in `script.js` using a translation dictionary.
- Default language is English.
- Language switcher lives in the header as `EN / AR`.
- Arabic mode switches the page to `lang="ar"` and `dir="rtl"`.
- Selected language is persisted in `localStorage`.

### Final Content Decisions
- Extra gallery image selected: `assets/774361792_18086030342253727_5992595618828369379_n.jpg`
- Email is not shown on the page because it was not available from the provided contact asset.
- Full visible website copy is available in both English and Arabic.

