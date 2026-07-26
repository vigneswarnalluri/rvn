import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build as esbuild } from 'esbuild';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import tailwindcss from '@tailwindcss/vite';

const page = (name) => resolve(__dirname, `src/${name}.html`);

/**
 * Inline the generated CSS straight into each HTML document and drop the
 * separate stylesheet request. This removes a render-blocking round-trip so the
 * first paint isn't gated on downloading a stylesheet.
 */
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const cssFiles = Object.keys(bundle).filter((file) => file.endsWith('.css'));
      const htmlFiles = Object.keys(bundle).filter((file) => file.endsWith('.html'));
      const inlined = new Set();

      for (const htmlFile of htmlFiles) {
        const htmlAsset = bundle[htmlFile];
        let source = htmlAsset.source;

        for (const cssFile of cssFiles) {
          const cssAsset = bundle[cssFile];
          const base = cssFile.split('/').pop();
          const linkRe = new RegExp(`<link[^>]*href="[^"]*${base}"[^>]*>`, 'g');
          if (linkRe.test(source)) {
            source = source.replace(linkRe, `<style>${cssAsset.source}</style>`);
            inlined.add(cssFile);
          }
        }

        htmlAsset.source = source;
      }

      // Remove now-unreferenced stylesheet assets from the output.
      for (const cssFile of inlined) delete bundle[cssFile];
    },
  };
}

/**
 * Rewrite root-absolute internal links (href="/page.html") to be relative
 * (href="./page.html") in the built HTML, so navigation works when the output
 * is served from any subfolder. Protocol-relative (//) and external URLs are
 * left untouched; assets are already handled by the relative `base`.
 */
function relativeLinks() {
  return {
    name: 'relative-links',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.keys(bundle)) {
        if (!file.endsWith('.html')) continue;
        const asset = bundle[file];
        if (typeof asset.source !== 'string') continue;
        asset.source = asset.source.replace(/(\s(?:href|action)=)"\/(?!\/)/g, '$1"./');
      }
    },
  };
}

/**
 * Remove `crossorigin` from module scripts/preloads so built pages can be
 * opened directly from disk (`file://`) without CORS-related blocking.
 */
function stripCrossoriginForFileScheme() {
  return {
    name: 'strip-crossorigin-for-file-scheme',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.keys(bundle)) {
        if (!file.endsWith('.html')) continue;
        const asset = bundle[file];
        if (typeof asset.source !== 'string') continue;
        asset.source = asset.source.replace(/\s+crossorigin(?=[\s>])/g, '');
      }
    },
  };
}

/**
 * Vite's preload helper tries to fetch sibling chunk files that no longer exist
 * in `dist` and fails on `file://`. Replace it with a direct importer call.
 */
function stripVitePreloadFromBundle(code) {
  return code.replace(
    /var \w+ = `modulepreload`;[\s\S]*?var (\$\d+) = function\(\w+, \w+, \w+\) \{[\s\S]*?\n  \};/,
    'var $1 = function(importer) { return importer(); };',
  );
}

/**
 * After Vite emits ES-module chunks, rebundle each page entry into a single
 * IIFE script so the built site works when opened directly from disk (`file://`).
 * Browsers block `type="module"` and dynamic `import()` on the file protocol.
 */
function bundleForFileProtocol(outDir) {
  const distDir = resolve(__dirname, outDir);
  const assetsDir = join(distDir, 'assets');
  const moduleScriptRe = /<script\s+type="module"\s+src="(\.\/assets\/[^"]+\.js)"\s*><\/script>/g;
  const modulePreloadRe = /<link[^>]*rel="modulepreload"[^>]*>\s*/g;

  return {
    name: 'bundle-for-file-protocol',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      const htmlFiles = readdirSync(distDir).filter((file) => file.endsWith('.html'));
      const entryScripts = new Set();

      for (const htmlFile of htmlFiles) {
        const source = readFileSync(join(distDir, htmlFile), 'utf8');
        for (const match of source.matchAll(moduleScriptRe)) {
          entryScripts.add(match[1]);
        }
      }

      const replacements = new Map();

      for (const relSrc of entryScripts) {
        const entryPath = join(distDir, relSrc.replace(/^\.\//, ''));
        const bundleName = relSrc
          .replace(/^\.\/assets\//, '')
          .replace(/-[A-Za-z0-9_-]+\.js$/, '.bundle.js');
        const bundleRel = `./assets/${bundleName}`;
        const bundlePath = join(assetsDir, bundleName);

        await esbuild({
          entryPoints: [entryPath],
          bundle: true,
          format: 'iife',
          globalName: 'RVN',
          outfile: bundlePath,
          platform: 'browser',
          define: { 'import.meta.url': '""' },
          logLevel: 'warning',
        });

        writeFileSync(bundlePath, stripVitePreloadFromBundle(readFileSync(bundlePath, 'utf8')));

        replacements.set(relSrc, bundleRel);
      }

      for (const htmlFile of htmlFiles) {
        const htmlPath = join(distDir, htmlFile);
        let source = readFileSync(htmlPath, 'utf8');

        source = source.replace(modulePreloadRe, '');

        for (const [oldSrc, newSrc] of replacements) {
          const escaped = oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          source = source.replace(
            new RegExp(`<script\\s+type="module"\\s+src="${escaped}"\\s*><\\/script>`, 'g'),
            `<script defer src="${newSrc}"></script>`,
          );
        }

        writeFileSync(htmlPath, source);
      }

      for (const file of readdirSync(assetsDir)) {
        if (!file.endsWith('.js') || file.endsWith('.bundle.js')) continue;
        unlinkSync(join(assetsDir, file));
      }
    },
  };
}

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  plugins: [
    tailwindcss(),
    handlebars({
      partialDirectory: resolve(__dirname, 'src/partials'),
    }),
    inlineCss(),
    relativeLinks(),
    stripCrossoriginForFileScheme(),
    bundleForFileProtocol('dist'),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      input: {
        dashboard: page('index'),
        products: page('products'),
        addProduct: page('add-product'),
        editProduct: page('edit-product'),
        orders: page('orders'),
        orderDetail: page('order-detail'),
        addOrder: page('add-order'),
        editOrder: page('edit-order'),
        customers: page('customers'),
        categories: page('categories'),
        addCategory: page('add-category'),
        editCategory: page('edit-category'),
        brands: page('brands'),
        addBrand: page('add-brand'),
        editBrand: page('edit-brand'),
        coupons: page('coupons'),
        addCoupon: page('add-coupon'),
        editCoupon: page('edit-coupon'),
        attributes: page('attributes'),
        addAttribute: page('add-attribute'),
        addUser: page('add-user'),
        roles: page('roles'),
        createRole: page('create-role'),
        media: page('media'),
        translation: page('translation'),
        currencyRates: page('currency-rates'),
        tax: page('tax'),
        productReviews: page('product-reviews'),
        supportTickets: page('support-tickets'),
        reports: page('reports'),
        listPage: page('list-page'),
        integrations: page('integrations'),
        history: page('history'),
        upgrade: page('upgrade'),
        updateApp: page('update-app'),
        settings: page('settings'),
        notifications: page('notifications'),
        shippingSettings: page('shipping-settings'),
        paymentSettings: page('payment-settings'),
        permissionSettings: page('permission-settings'),
        signin: page('signin'),
      },
    },
  },
  server: {
    open: '/index.html',
  },
});
