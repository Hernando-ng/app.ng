# Single Airbnb Flat Landing Page Template

A clean, responsive, mobile-friendly one-page website designed specifically for a single Airbnb or short-let flat. Built with vanilla HTML5, modern CSS3, and lightweight JavaScript — no frameworks, no build steps, and lightning fast.

---

## 🌟 Features Included

1. **Hero Section:** High-impact property imagery, headline, welcoming badge, guest rating & Superhost badges, and clear "Book Now" CTA.
2. **About The Flat:** Key specs summary (1 bedroom, 1 bathroom, 2 guests, flexible stay), self-catering highlights, and a 4-photo responsive gallery.
3. **Amenities Grid:** 10 core amenities with crisp SVG icons:
   - Fast Wi-Fi (150+ Mbps)
   - Smart TV (4K streaming apps)
   - Air conditioning & oscillating fan
   - Fully equipped kitchen
   - Washing machine & ironing kit
   - Free on-premise secure parking
   - 24/7 self check-in keypad
   - Clean luxury bedding & towels
   - Security & safety detectors
   - Ergonomic workspace / desk
4. **Location & Neighbourhood:** Highlights of local transit, supermarkets, bakeries, cafes, and airport proximity, plus an embedded Google Maps preview and direct Google Maps link.
5. **House Rules:** Clear, polite guidelines on check-in/out times, smoking policy, quiet hours, maximum guest count, and pet policy.
6. **Pricing & Direct Booking Form:**
   - Nightly rate display, cleaning fee, security deposit, minimum nights, and weekly/monthly discounts.
   - Clean enquiry form with validation (name, email, phone, check-in, check-out, guests, message).
   - Generates pre-filled email to host and optional one-click WhatsApp reservation message.
   - Direct button link to official Airbnb listing.
7. **Reviews & Testimonials:** 3 sample guest review cards with star ratings, guest details, and clear indicators that they can be replaced with real reviews.
8. **Contact Section & Footer:** Direct WhatsApp, email, phone call, Instagram links, and full footer with copyright and quick navigation.

---

## 🎨 Design & Aesthetic

- **Color Palette:** Warm, welcoming tones suited for hospitality:
  - Background: Soft warm beige (`#FAF8F5`)
  - Accent / CTA: Warm terracotta (`#C85A32`)
  - Typography / Secondary: Deep charcoal navy (`#2C3E50`) and neutral dark (`#24292E`)
  - Highlights: Crisp white (`#FFFFFF`) and warm cream (`#F3EFEA`)
- **Typography:** Google Fonts *Playfair Display* for headings and *Plus Jakarta Sans* for clean, modern readability.
- **Responsiveness:** Tested on mobile phones, tablets, and widescreen desktop displays. Includes an accessible mobile drawer menu.

---

## 📝 Customization Guide: Placeholders to Replace

To adapt this website for your property, search and replace the following placeholder values in `index.html` and `js/script.js`:

| Placeholder | Description | Example Replacement |
| :--- | :--- | :--- |
| `[FLAT NAME]` | The name of your apartment or flat | *The Garden Suite* or *Harbour View Studio* |
| `[CITY / NEIGHBOURHOOD]` | Location of the property | *Notting Hill, London* |
| `[City]` | City name | *London* |
| `[PRICE]` | Nightly rate | *£115* or *$140* |
| `[CLEANING FEE e.g. $45]` | Cleaning fee per stay | *£35* |
| `[DEPOSIT e.g. $150]` | Security deposit | *£100* |
| `[EMAIL ADDRESS]` | Host email address | *bookings@myflat.com* |
| `[PHONE NUMBER]` | Host phone number | *+44 7123 456789* |
| `[PHONE-NUMBER]` | Phone number for WhatsApp link (digits only, e.g. `447123456789`) | *447123456789* |
| `[INSTAGRAM-HANDLE]` | Your Instagram handle | *gardensuite_london* |
| `[Airbnb listing link / WhatsApp / booking form]` | URL to your Airbnb listing | `https://airbnb.com/h/yourflat` |

### Replacing Property Images
The template currently uses high-quality Unsplash architecture photos as placeholders. To use your own photos:
1. Place your `.jpg` or `.webp` files in an `images/` directory.
2. Update the `src` attribute of the `<img>` tags in `index.html` (`.hero-image` and `.gallery-item img`).

---

## 🚀 Running & Deploying Locally

### Local Preview
Because this is a pure static site, you can view it directly by opening `index.html` in any web browser, or serve it using Python's built-in server:

```bash
# Python 3
python3 -m http.server 8080
```
Then visit `http://localhost:8080`.

### Hosting Options (Free & Instant)
- **GitHub Pages:** Push to a GitHub repository and turn on Pages in repository settings.
- **Vercel / Netlify:** Drag-and-drop the directory or connect your repository.
- **Cloudflare Pages:** Zero-config static asset hosting with global CDN.
