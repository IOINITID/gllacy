const {src, dest, watch, series, parallel} = require('gulp');
const del = require('del');
const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');
const htmlmin = require('gulp-htmlmin');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const webpicture = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();

// Source files enum
const SourceFiles = {
  MARKUP: 'source/**/*.html',
  STYLES: 'source/sass/style.scss',
  SCRIPTS: 'source/js/**/*.js',
  FONTS: 'source/fonts/**/*.{woff2,woff,ttf}',
  IMAGES: 'source/img/**/*.{jpg,png,svg}',
  SVG: 'source/img/*-icon.svg',
  WATCH: {
    MARKUP: 'source/**/*.html',
    STYLES: 'source/sass/**/*.scss',
    SCRIPTS: 'source/js/**/*.js',
    FONTS: 'source/fonts/**/*.{woff2,woff,ttf}',
    IMAGES: 'source/img/**/*.{jpg,png,svg}',
    SVG: 'source/img/*-icon.svg',
  }
};

// Removing the build directory
const remove = () => {
  return del('build');
};

// Markup optimizations
const markup = () => {
  const MARKUP = SourceFiles.MARKUP;

  return src(MARKUP)
  .pipe(posthtml([include()]))
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(dest('build'))
  .pipe(browserSync.stream());
};

// Styles optimizations
const styles = () => {
  const STYLES = SourceFiles.STYLES;

  return src(STYLES)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());
};

// JavaScript optimizations
const scripts = () => {
  const SCRIPTS = SourceFiles.SCRIPTS;

  return src(SCRIPTS)
    .pipe(babel({presets: ['@babel/preset-env']}))
    .pipe(terser())
    .pipe(rename({suffix: '.min'}))
    .pipe(dest('build/js'))
    .pipe(browserSync.stream());
};

// Images optimizations
const images = () => {
  const IMAGES = SourceFiles.IMAGES;

  return src(IMAGES)
    .pipe(imagemin([
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 3})
    ]))
    .pipe(dest('build/img'))
    .pipe(browserSync.stream());
};

// Copying fonts files to the build directory
const fonts = () => {
  const FONTS = SourceFiles.FONTS;

  return src(FONTS)
    .pipe(dest('build/fonts'))
    .pipe(browserSync.stream());
};

// Creating WebP images
const webp = () => {
  const IMAGES = SourceFiles.IMAGES;

  return src(IMAGES)
    .pipe(webpicture({quality: 75}))
    .pipe(dest('build/img'))
    .pipe(browserSync.stream());
};

// Creation of SVG sprites
const sprites = () => {
  const SVG = SourceFiles.SVG;

  return src(SVG)
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'))
    .pipe(browserSync.stream());
};

// Server live reloading
const server = () => {
  browserSync.init({server: 'build'});

  const MARKUP = SourceFiles.WATCH.MARKUP;
  const STYLES = SourceFiles.WATCH.STYLES;
  const SCRIPTS = SourceFiles.WATCH.SCRIPTS;
  const FONTS = SourceFiles.WATCH.FONTS;
  const IMAGES = SourceFiles.WATCH.IMAGES;
  const SVG = SourceFiles.WATCH.SVG;

  watch(MARKUP, markup);
  watch(STYLES, styles);
  watch(SCRIPTS, scripts);
  watch(FONTS, fonts);
  watch(IMAGES, images);
  watch(SVG, sprites);
};

// Build project
const build = series(remove, parallel(markup, styles, scripts, images, fonts, webp, sprites));

// Start server
const start = series(build, server);

exports.build = build;
exports.start = start;
