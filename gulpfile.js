import gulp from 'gulp';
import { deleteAsync as del } from 'del';
import sass from 'sass';
import gulpSass from 'gulp-sass';
import pug from 'gulp-pug';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import browserSync from 'browser-sync';
import autoPrefixer from 'gulp-autoprefixer';
import postcss from 'gulp-postcss';
import mqpacker from 'css-mqpacker';
import imagemin from 'gulp-imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import fs from 'fs';

const dartSass = gulpSass(sass);

const srcBase = './_static/src';
const serverBase = './_server/src';
const distBase = './_static/dist';

const srcPath = {
  scss: `${srcBase}/scss/**/*.scss`,
  html: `${srcBase}/**/*.html`,
  pug: `${srcBase}/pug/**/*.pug`,
  img: `${srcBase}/img/**/*`,
  js: `${srcBase}/js/**/*.js`,
  php: `${srcBase}/**/*.php`,
  font: `${srcBase}/font/**/*`,
};

const serverPath = {
  css: `${serverBase}/css/`,
  html: `${serverBase}/html/`,
  img: `${serverBase}/img/`,
  js: `${serverBase}/js/`,
  php: `${serverBase}/`,
  font: `${serverBase}/font/`,
};

const distPath = {
  css: `${distBase}/css/`,
  html: `${distBase}/`,
  img: `${distBase}/img/`,
  js: `${distBase}/js/`,
  php: `${distBase}/`,
  font: `${distBase}/font/`,
};

const browserSyncOption = {
  server: distBase  // "./_static/dist/" と同義
};

/**
 * ディレクトリが存在しない場合は作成する
 */
const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  } catch (error) {
    console.error('Error creating directory:', error);
  }
};

/**
 * dist と server の両方へコピーする汎用関数
 */
const copyToDistAndServer = (src, dist, server) => {
  return gulp
    .src(src)
    .pipe(gulp.dest(dist))
    .pipe(gulp.dest(server));
};

/**
 * クリーンタスク
 */
export const clean = async () => {
  await del(`${distBase}/**`);
  return del(`${serverBase}/**`);
};

/**
 * Sass コンパイル
 */
export const compileSass = () => {
  ensureDir(`${srcBase}/scss`);
  return gulp
    .src(srcPath.scss, { sourcemaps: true })
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(dartSass({ outputStyle: 'expanded' }))
    .pipe(autoPrefixer({ cascade: false }))
    .pipe(postcss([mqpacker()]))
    .pipe(gulp.dest(distPath.css, { sourcemaps: './' }))
    .pipe(gulp.dest(serverPath.css, { sourcemaps: './' }))
    .pipe(browserSync.stream())
    .pipe(notify({ message: 'Sassをコンパイルしました！', onLast: true }));
};

/**
 * Pug コンパイル
 */
export const compilePug = () => {
  ensureDir(`${srcBase}/pug`);
  // 「_」から始まるPugはコンパイルしないようにしている
  return gulp
    .src([srcPath.pug, `!${srcBase}/pug/**/_*.pug`], { allowEmpty: true })
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(distPath.html))
    .pipe(gulp.dest(serverPath.html))
    .pipe(browserSync.stream())
    .pipe(notify({ message: 'Pugをコンパイルしました！', onLast: true }));
};

/**
 * 画像圧縮 (imagemin)
 */
export const optimizeImages = () => {
  ensureDir(`${srcBase}/img`);
  return gulp
    .src(srcPath.img, { encoding: false })
    .pipe(
      imagemin([
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant(),
        imageminSvgo({
          plugins: [{ name: 'removeViewBox', active: false }]
        })
      ])
    )
    .pipe(gulp.dest(distPath.img))
    .pipe(gulp.dest(serverPath.img));
};

/**
 * HTMLコピー
 */
export const copyHtml = () => {
  return copyToDistAndServer(srcPath.html, distPath.html, serverPath.html);
};

/**
 * JSコピー
 */
export const copyJs = () => {
  return copyToDistAndServer(srcPath.js, distPath.js, serverPath.js);
};

/**
 * PHPコピー
 */
export const copyPhp = () => {
  return copyToDistAndServer(srcPath.php, distPath.php, serverPath.php);
};

/**
 * フォントコピー
 */
export const copyFont = () => {
  ensureDir(`${srcBase}/font`);
  return copyToDistAndServer(srcPath.font, distPath.font, serverPath.font);
};

/**
 * ブラウザ同期起動
 */
export const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
};

/**
 * ブラウザリロード
 */
export const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

/**
 * ファイルウォッチ
 */
export const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(compileSass, browserSyncReload));
  gulp.watch(srcPath.pug, gulp.series(compilePug, browserSyncReload));
  gulp.watch(srcPath.html, gulp.series(copyHtml, browserSyncReload));
  gulp.watch(srcPath.js, gulp.series(copyJs, browserSyncReload));
  gulp.watch(srcPath.img, gulp.series(optimizeImages, browserSyncReload));
  gulp.watch(srcPath.php, gulp.series(copyPhp, browserSyncReload));
  gulp.watch(srcPath.font, gulp.series(copyFont, browserSyncReload));
};

/**
 * デフォルトタスク
 */
const build = gulp.series(
  clean,
  gulp.parallel(copyHtml, compileSass, compilePug, copyJs, optimizeImages, copyPhp, copyFont)
);

export default gulp.series(
  build,
  gulp.parallel(watchFiles, browserSyncFunc)
);
