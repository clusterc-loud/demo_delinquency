```markdown
# Design System Document: Financial Foresight & Tonal Trust

## 1. Overview & Creative North Star: "The Digital Arboretum"
This design system moves away from the aggressive, high-friction aesthetics of traditional "disruptive" fintech. Instead, it adopts the **Creative North Star: The Digital Arboretum.** 

Just as an arboretum is a curated, protected space of growth and observation, this system treats complex banking data as a living ecosystem that requires nurturing and clarity. We break the "SaaS template" look by using **Organic Asymmetry**—where large-scale typography and generous negative space allow data to breathe. By layering lush forest greens with surgical tech accents, we create an environment that feels both ancient in its reliability and futuristic in its intelligence.

---

## 2. Color & Surface Architecture
We do not use color merely for decoration; we use it to define the "physics" of the interface.

### The Palette (Nature-Tech)
*   **Primary (`#006e2d`):** Our "Growth" signal. Reserved for high-intent actions.
*   **Primary Container (`#1db954`):** A vibrant accent used to draw the eye to critical AI-driven insights.
*   **Surface (`#f0fdf1`):** The foundational "Light Sage" canvas. 
*   **On-Surface / Deep Forest (`#131e17`):** Our ink. High-contrast for maximum authority.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. 
*   **Separation through Tone:** Boundaries must be defined solely through background shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a clear but soft structural break.
*   **Surface Hierarchy & Nesting:** Use the tiers (`lowest` to `highest`) to create physical depth. Treat the UI as stacked sheets of fine paper. 
    *   *Canvas:* `surface`
    *   *Section:* `surface-container-low`
    *   *Interactive Card:* `surface-container-lowest` (White) to provide a "lifted" feel.

### The "Glass & Gradient" Rule
To escape the "flat" look, use **Glassmorphism** for floating overlays (e.g., Modals, Tooltips). Utilize semi-transparent surface colors with a `backdrop-blur` of 12px-20px. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` to `primary-container` on primary CTAs to give them a "jewel" quality against the organic sage backgrounds.

---

## 3. Typography: Editorial Authority
We pair **Plus Jakarta Sans** (Display/Headlines) with **Inter** (Body/Labels) to balance character with legibility.

*   **Display & Headline (Plus Jakarta Sans):** These are your "Editorial Voices." Use `display-lg` for hero data points (e.g., At-Risk Capital). The bold weight conveys the "Authoritative" pillar of our brand.
*   **Body & Label (Inter):** These are your "Functional Voices." Inter's high x-height ensures that even at `body-sm` (0.75rem), complex financial tables remain readable.
*   **Tonal Hierarchy:** Use `on-surface-variant` (Slate Gray) for metadata to ensure the user’s eye gravitates toward the primary data points first.

---

## 4. Elevation & Depth
In this system, depth is a product of light and layering, not artificial shadows.

*   **The Layering Principle:** Stacking `surface-container-highest` on `surface-container-low` creates a natural hierarchy. The higher the container's importance, the "brighter" (closer to `#FFFFFF`) it becomes.
*   **Ambient Shadows:** If an element must float (e.g., a critical intervention alert), use a shadow with a blur of `40px` and an opacity of `6%`. The shadow color must be a tinted version of `on-surface` (Deep Forest), never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` at **15% opacity**. A solid, opaque border is a failure of the design language.

---

## 5. Components
All components adhere to the **md (1.5rem / 24px) roundedness scale** to maintain a friendly, "calm" hand-feel.

*   **Buttons:**
    *   *Primary:* Gradient-filled (`primary` to `primary-container`), 24px rounded, white text.
    *   *Tertiary:* No container. Only `primary` colored text. Used for low-emphasis actions like "Dismiss."
*   **Input Fields:** Use `surface-container-highest` for the field background. No bottom line. On focus, transition the background to `surface-container-lowest` with a "Ghost Border" of `primary`.
*   **Cards & Lists:** **Forbid dividers.** To separate list items, use `16px` of vertical white space or alternate subtle background shifts between `surface-container-low` and `surface`.
*   **AI Intervention Chips:** A custom component. Use `primary-fixed` background with `on-primary-fixed` text to highlight "AI Recommended" actions.
*   **Risk Gauges:** Utilize the `tertiary` color scale (Slate/Blue-Grey) for neutral data, transitioning to `error` only when delinquency is imminent.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical layouts where the left column (Navigation/Context) is significantly narrower than the right column (Action/Data).
*   **Do** lean into `display-lg` for single, impactful numbers.
*   **Do** use 24px (`md`) or 32px (`lg`) corner radii for all main containers to maintain the "Soft Minimalism" feel.

### Don't:
*   **Don't** use pure black (#000000) for text; use `on-surface` (Deep Forest) to maintain the "Nature-Tech" warmth.
*   **Don't** use standard "Material Design" shadows. If it looks like a default shadow, it is wrong.
*   **Don't** use more than one primary CTA per screen. In a "Calm" system, we do not shout; we guide.
*   **Don't** use 1px lines to separate data rows. Use spacing and tonal shifts.

---

**Director’s Final Note:** 
This system is designed to build trust with high-level stakeholders. Every pixel must feel intentional. If an element doesn't serve a clear purpose in the "Digital Arboretum," remove it. Let the data be the hero, and let the sage-and-forest tones provide the sanctuary.```