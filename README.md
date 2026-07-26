# RVN - eCommerce Bootstrap5 Template

RVN is a modern and responsive eCommerce template built with **Bootstrap 5**, designed to provide a feature-rich and aesthetically pleasing layout for online stores. The template comes with **100+ demos**, **500+ inner pages**, and **750+ elements**, making it highly customizable for eCommerce projects.

## Features

- **Bootstrap 5** powered design
- **100+ Demos** for various eCommerce use cases
- **500+ Inner Pages** including product pages, checkout, cart, and more
- **750+ Elements** for UI components and sections
- Fully **responsive** and **mobile-friendly**
- Gulp-based workflow with HTML partials, SCSS compilation, and asset minification
- Well-commented code for easy integration

## Prerequisites

- **Node.js** (v14 or later recommended)
- **npm**

## Installation

```bash
git clone https://github.com/your-username/RVN.git
cd RVN-html
npm install
```

## Project Structure

```text
RVN-html/
├── src/                    # Source files (edit here)
│   ├── *.html              # Page templates
│   ├── partials/           # Reusable HTML partials (@@include)
│   └── assets/
│       ├── scss/           # SCSS source (compiled to CSS)
│       ├── css/            # Vendor & plugin CSS
│       ├── js/             # main.js, vendor & plugin JS
│       ├── images/
│       ├── fonts/
│       └── videos/
├── dest/                   # Build output (deploy this folder)
├── gulpfile.js
├── package.json
└── vercel.json
```

### Source vs Output

| Location | Purpose |
|----------|---------|
| `src/` | All development and editing |
| `dest/` | Compiled HTML and production-ready assets |

**Important:** `dest/` does **not** include source SCSS, unminified `style.css`, or unminified `main.js`. Only the assets referenced in HTML are generated.

## NPM Scripts

### Development

```bash
npm run dev
```

Starts the Gulp dev workflow:

- Compiles HTML from `src/` with partial includes
- Compiles SCSS → `dest/assets/css/style.min.css`
- Minifies `main.js` → `dest/assets/js/main.min.js`
- Copies vendor/plugin CSS & JS, fonts, images, and videos
- Starts BrowserSync with live reload
- Watches files for changes

### Production Build (CSS & JS only)

```bash
npm run build
```

Minifies **CSS and JS assets only** into `dest/`:

| Task | Output |
|------|--------|
| `buildStyleCss` | `dest/assets/css/style.min.css` |
| `buildVendorCss` | `dest/assets/css/vendor/*` (minified) |
| `buildPluginsCss` | `dest/assets/css/plugins/*` (minified) |
| `buildVendorJs` | `dest/assets/js/vendor/*` (minified) |
| `buildPluginsJs` | `dest/assets/js/plugins/*` (minified) |
| `buildMainJs` | `dest/assets/js/main.min.js` |

`npm run build` does **not** compile HTML or copy images/fonts/videos. Run the individual Gulp tasks below when you need a full deploy output.

## Gulp Tasks

Run tasks directly with `npx gulp <task-name>`.

| Task | Description |
|------|-------------|
| `html` | Compile HTML pages with partial includes |
| `styleCss` | Compile SCSS to `style.min.css` (dev, with sourcemaps) |
| `vendorCss` | Copy vendor CSS to `dest/` |
| `pluginsCss` | Copy plugin CSS to `dest/` |
| `vendorJs` | Copy vendor JS to `dest/` |
| `pluginsJs` | Copy plugin JS to `dest/` |
| `mainJs` | Minify `main.js` → `main.min.js` |
| `rbtFonts` | Copy fonts |
| `rbtImage` | Copy images |
| `rbtVideos` | Copy videos |
| `build` | Minify all CSS & JS (production) |
| `clean:dist` | Delete entire `dest/` folder |
| `clean:destExtras` | Remove `style.css`, `main.js`, and `dest/assets/scss/` |

### Common Workflows

**Full deploy output (HTML + assets + minified CSS/JS):**

```bash
npx gulp html
npx gulp rbtFonts
npx gulp rbtImage
npx gulp rbtVideos
npm run build
```

**HTML changes only:**

```bash
npx gulp html
```

**SCSS changes only:**

```bash
npx gulp styleCss
```

**JavaScript changes only:**

```bash
npx gulp mainJs
```

## Asset References

The template loads minified production assets:

- CSS: `assets/css/style.min.css`
- JS: `assets/js/main.min.js`

Defined in:

- `src/partials/styles.html`
- `src/partials/scripts.html`

## Deployment

Deploy the **`dest/`** folder to your hosting provider.

For Vercel, `vercel.json` is included with security headers. Point the project root or output directory to `dest/` depending on your deployment setup.

## Tech Stack

- HTML5 + Gulp File Include (`@@include`)
- SCSS (Dart Sass)
- Bootstrap 5
- Gulp 4
- gulp-clean-css (CSS minification)
- gulp-terser (JS minification)
- BrowserSync (local dev server)

## License

ISC
