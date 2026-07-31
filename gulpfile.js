const gulp = require('gulp');
const del = require('del');
const clean = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const browsersync = require('browser-sync').create();
// const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('autoprefixer');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const fileInclude = require('gulp-file-include');
const beautifyCode = require('gulp-beautify-code');
const postcss = require('gulp-postcss');
const cached = require('gulp-cached');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const changed = require('gulp-changed');
// const htmlmin = require('gulp-htmlmin');

// Source Folder Locations
const src = {
    'root': './src/',
    'rootHtml': './src/*.html',
    'rootPartials': './src/partials/',
    'fontsAll': './src/assets/fonts/**/*',
    'rootVendorCss': './src/assets/css/vendor/*.css',
    'rootPluginsCss': './src/assets/css/plugins/*.css',
    'styleScss': './src/assets/scss/*.scss',
    'scssAll': './src/assets/scss/**/*',
    'rootVendorJs': './src/assets/js/vendor/*.js',
    'rootPluginsJs': './src/assets/js/plugins/*.js',
    'mainJs': './src/assets/js/main.js',
    'rootimage': './src/assets/images/**/*',
    'rootVideos': './src/assets/videos/**/*',
};

// Destination Folder Locations
const dest = {
    'root': './dest/',
    'fonts': './dest/assets/fonts/',
    'assets': './dest/assets/',
    'rootCss': './dest/assets/css',
    'rootVendorCss': './dest/assets/css/vendor/',
    'rootPluginsCss': './dest/assets/css/plugins/',
    'rootJs': './dest/assets/js',
    'rootVendorJs': './dest/assets/js/vendor/',
    'rootPluginsJs': './dest/assets/js/plugins/',
    'images': './dest/assets/images',
    'videos': './dest/assets/videos',
};

// Base Folder Locations
const base = {
    base: {
        dir: './'
    },
    node: {
        dir: './node_modules'
    },
    packageLock: {
        files: './package-lock.json'
    }
};

// Autoprefixer Options
const autoPreFixerOptions = [
    "last 4 version",
    "> 1%",
    "ie >= 9",
    "ie_mob >= 10",
    "ff >= 30",
    "chrome >= 34",
    "safari >= 7",
    "opera >= 23",
    "ios >= 7",
    "android >= 4",
    "bb >= 10"
];

// BrowserSync Setup
gulp.task('browsersync', function (callback) {
    browsersync.init({
        server: {
            baseDir: [dest.root, src.root, base.base.dir]
        },
    });
    callback();
});

gulp.task('browsersyncReload', function (callback) {
    browsersync.reload();
    callback();
});

// Watch Task
gulp.task('watch', function () {
    gulp.watch(src.scssAll, gulp.series('styleCss', 'browsersyncReload'));
    gulp.watch(src.rootVendorCss, gulp.series('vendorCss', 'browsersyncReload'));
    gulp.watch(src.rootPluginsCss, gulp.series('pluginsCss', 'browsersyncReload'));
    gulp.watch(src.rootVendorJs, gulp.series('vendorJs', 'browsersyncReload'));
    gulp.watch(src.rootPluginsJs, gulp.series('pluginsJs', 'browsersyncReload'));
    gulp.watch(src.mainJs, gulp.series('mainJs', 'browsersyncReload'));
    gulp.watch(src.fontsAll, gulp.series('rbtFonts', 'browsersyncReload'));
    gulp.watch(src.rootimage, gulp.series('rbtImage', 'browsersyncReload'));
    gulp.watch(src.rootVideos, gulp.series('rbtVideos', 'browsersyncReload'));
    gulp.watch(src.rootPartials, gulp.series('html', 'browsersyncReload'));
    gulp.watch(src.rootHtml, gulp.series(['html', 'styleCss'], 'browsersyncReload'));
});



// Custom Plumber for Error Handling
function customPlumber(errTitle) {
    return plumber({
        errorHandler: notify.onError({
            title: errTitle || "Error running Gulp",
            message: "Error: <%= error.message %>",
            sound: "Glass"
        })
    });
}

const minifyCssOptions = { compatibility: '*' };

// Dev: compile SCSS to minified CSS only (matches production output)
gulp.task('styleCss', function () {
    return gulp
        .src(src.styleScss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS(minifyCssOptions))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest(dest.rootCss));
});

// Build: compile SCSS and output minified CSS only
const buildStyleCss = () => {
    return gulp
        .src(src.styleScss)
        .pipe(customPlumber('Error On Compiling Style Scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS(minifyCssOptions))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dest.rootCss));
};

const buildVendorCss = () => {
    return gulp
        .src(src.rootVendorCss)
        .pipe(customPlumber('Error On Minifying Vendor CSS'))
        .pipe(cleanCSS(minifyCssOptions))
        .pipe(gulp.dest(dest.rootVendorCss));
};

const buildPluginsCss = () => {
    return gulp
        .src(src.rootPluginsCss)
        .pipe(customPlumber('Error On Minifying Plugins CSS'))
        .pipe(cleanCSS(minifyCssOptions))
        .pipe(gulp.dest(dest.rootPluginsCss));
};

const terserOptions = { ecma: 2020, module: false, compress: { passes: 1 } };

const buildVendorJs = () => {
    return gulp
        .src(src.rootVendorJs)
        .pipe(customPlumber('Error On Minifying Vendor JS'))
        .pipe(terser(terserOptions))
        .pipe(gulp.dest(dest.rootVendorJs));
};

const buildPluginsJs = () => {
    return gulp
        .src(src.rootPluginsJs)
        .pipe(customPlumber('Error On Minifying Plugins JS'))
        .pipe(terser(terserOptions))
        .pipe(gulp.dest(dest.rootPluginsJs));
};

const buildMainJs = () => {
    gulp.src('./src/assets/js/api-client.js')
        .pipe(customPlumber('Error On Minifying API Client JS'))
        .pipe(terser(terserOptions))
        .pipe(gulp.dest(dest.rootJs));

    return gulp
        .src(src.mainJs)
        .pipe(customPlumber('Error On Minifying Main JS'))
        .pipe(terser(terserOptions))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dest.rootJs));
};

gulp.task('buildStyleCss', buildStyleCss);
gulp.task('buildVendorCss', buildVendorCss);
gulp.task('buildPluginsCss', buildPluginsCss);
gulp.task('buildVendorJs', buildVendorJs);
gulp.task('buildPluginsJs', buildPluginsJs);
gulp.task('buildMainJs', buildMainJs);

// Vendor CSS Task - Copy Vendor CSS
gulp.task('vendorCss', function () {
    return gulp
        .src(src.rootVendorCss)
        .pipe(customPlumber('Error On Copying Vendor CSS'))
        .pipe(gulp.dest(dest.rootVendorCss));
});

// Plugins CSS Task - Copy Plugins CSS
gulp.task('pluginsCss', function () {
    return gulp
        .src(src.rootPluginsCss)
        .pipe(customPlumber('Error On Copying Plugins CSS'))
        .pipe(gulp.dest(dest.rootPluginsCss));
});

// HTML Task - Compile HTML Files with Partial Includes (Changed Files Only)
gulp.task('html', function () {
    return gulp
        .src(src.rootHtml)
        .pipe(customPlumber('Error On Compile HTML'))
        .pipe(fileInclude({
            prefix: '@@',
            basepath: src.rootPartials
        }))
        // .pipe(htmlmin({
        //     collapseWhitespace: true,
        //     removeComments: true,
        //     removeRedundantAttributes: true,
        //     removeScriptTypeAttributes: true,
        //     removeStyleLinkTypeAttributes: true,
        //     minifyJS: true,
        //     minifyCSS: true
        // }))
        .pipe(gulp.dest(dest.root));
});

// JS Task - Copy Vendor JS
gulp.task('vendorJs', function () {
    return gulp
        .src(src.rootVendorJs)
        .pipe(customPlumber('Error On Copying Vendor JS'))
        .pipe(gulp.dest(dest.rootVendorJs));
});

// Plugins JS Task - Copy Plugins JS
gulp.task('pluginsJs', function () {
    return gulp
        .src(src.rootPluginsJs)
        .pipe(customPlumber('Error On Combining & Minifying Vendor JS'))
        .pipe(gulp.dest(dest.rootPluginsJs));
});

// Main JS Task - Minify main.js and copy api-client.js
gulp.task('mainJs', function () {
    gulp.src('./src/assets/js/api-client.js')
        .pipe(gulp.dest(dest.rootJs));

    return gulp
        .src(src.mainJs)
        .pipe(customPlumber('Error On Minifying Main Js File'))
        .pipe(terser(terserOptions))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(dest.rootJs));
});

// Font Task - Copy Fonts
gulp.task('rbtFonts', function () {
    return gulp
        .src(src.fontsAll)
        .pipe(customPlumber('Error On Copy Fonts'))
        .pipe(gulp.dest(dest.fonts));
});

// Image Task - Copy Images
gulp.task('rbtImage', function () {
    return gulp
        .src(src.rootimage)
        .pipe(customPlumber('Error On Compiling Images'))
        .pipe(gulp.dest(dest.images));
});

// Video Task - Copy Videos
gulp.task('rbtVideos', function () {
    return gulp
        .src(src.rootVideos)
        .pipe(customPlumber('Error On Compiling Videos'))
        .pipe(gulp.dest(dest.videos));
});

// Clean Task - Clean Package Lock & Destination Folder
gulp.task('clean:packageLock', function (callback) {
    del.sync(base.packageLock.files);
    callback();
});

gulp.task('clean:dist', function (callback) {
    del.sync(dest.root);
    callback();
});

// Remove unneeded files from dest (source SCSS stays in src only)
gulp.task('clean:destExtras', function (callback) {
    del.sync([
        `${dest.rootCss}/style.css`,
        `${dest.rootJs}/main.js`,
        './dest/assets/scss',
    ]);
    callback();
});

// Default Task - Run All Tasks
gulp.task('default', gulp.series(
    gulp.parallel('html', 'styleCss', 'vendorCss', 'pluginsCss', 'vendorJs', 'pluginsJs', 'mainJs', 'rbtFonts', 'rbtImage', 'rbtVideos', 'clean:packageLock', 'clean:dist'),
    'clean:destExtras',
    gulp.parallel('browsersync', 'watch')
));

// Build Task - Minify CSS and JS assets only
gulp.task('build', gulp.series(
    'buildStyleCss',
    'buildVendorCss',
    'buildPluginsCss',
    'buildVendorJs',
    'buildPluginsJs',
    'buildMainJs',
    'clean:destExtras'
));

// Production Distribution Build Task - compiles HTML, SCSS, JS and copies assets
gulp.task('dist', gulp.series(
    'clean:dist',
    gulp.parallel('html', 'buildStyleCss', 'buildVendorCss', 'buildPluginsCss', 'buildVendorJs', 'buildPluginsJs', 'buildMainJs', 'rbtFonts', 'rbtImage', 'rbtVideos'),
    'clean:destExtras'
));

