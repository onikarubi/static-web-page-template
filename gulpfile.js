import gulp from 'gulp';
import { deleteAsync as del } from 'del';
import sass from 'gulp-dart-sass';
// import pug from 'gulp-pug';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import browserSync from 'browser-sync';
// import autoprefixer from 'gulp-autoprefixer';
import postcss from 'gulp-postcss';
import mqpacker from 'css-mqpacker';
import imagemin from 'gulp-imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';

const srcBase = './_static/src';
const serverBase = './_server/src';
const distBase = './_static/dist';


const srcPath = {
  'scss': srcBase + '/scss/**/*.scss',
  'html': srcBase + '/**/*.html',
  // 'pug': srcBase + '/pug/**/*.pug',
  'img': srcBase + '/img/**/*',
  'js': srcBase + '/js/**/*.js',
  'php': srcBase + '/**/*.php',
  'font': srcBase + '/font/**/*',
};

const serverPath = {
  'css': serverBase + '/css/',
  'html': serverBase + '/html/',
  'img': serverBase + '/img/',
  'js': serverBase + '/js/',
  'php': serverBase + '/',
  'font': serverBase + '/font/',
};

const distPath = {
  'css': distBase + '/css/',
  'html': distBase + '/',
  'img': distBase + '/img/',
  'js': distBase + '/js/',
  'php': distBase + '/',
  'font': distBase + '/font/',
};



const clean = async () => {
  await del(distBase + '/**');
  return del(serverBase + '/**');
}


// const TARGET_BROWSERS = [
//   'last 2 versions',
//   'ie >= 11'
// ];


const cssSass = () => {
  return gulp.src(srcPath.scss, {
    sourcemaps: true
  })
    .pipe(
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    // .pipe(autoprefixer(TARGET_BROWSERS))
    .pipe(postcss([mqpacker()]))
    .pipe(gulp.dest(distPath.css, {
      sourcemaps: './'
    }))
    .pipe(gulp.dest(serverPath.css, {
      sourcemaps: './'
    }))
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sassをコンパイルしました！',
      onLast: true
    }))
}

// const htmlPug = () => {
//   return gulp
//     .src([srcPath.pug, '!_static/src/pug/**/_*.pug'])
//     .pipe(pug({
//       pretty: true
//     }))
//     .pipe(gulp.dest(distPath.html, {
//       sourcemaps: true
//     }))
//     .pipe(gulp.dest(serverPath.html, {
//       sourcemaps: true
//     }))
//     .pipe(browserSync.stream())
//     .pipe(notify({
//       message: 'Pugをコンパイルしました！',
//       onLast: true
//     }))
// }


const imgImagemin = () => {
  return gulp.src(srcPath.img)
    .pipe(
      imagemin(
        [
          imageminMozjpeg({
            quality: 80
          }),
          imageminPngquant(),
          imageminSvgo({ // SVGOの設定
            plugins: [
              {
                name: "removeViewBox",
                active: false, // viewBoxを保持
              },
            ],
          }),
        ]
      )
    )
    .pipe(gulp.dest(distPath.img))
    .pipe(gulp.dest(serverPath.img))
}



const html = () => {
  return gulp.src(srcPath.html)
    .pipe(gulp.dest(distPath.html))
    .pipe(gulp.dest(serverPath.html))
}


const js = () => {
  return gulp.src(srcPath.js)
    .pipe(gulp.dest(distPath.js))
    .pipe(gulp.dest(serverPath.js))
}



const php = () => {
  return gulp.src(srcPath.php)
    .pipe(gulp.dest(distPath.php))
    .pipe(gulp.dest(serverPath.php))
}


const font = () => {
  return gulp.src(srcPath.font)
    .pipe(gulp.dest(distPath.font))
    .pipe(gulp.dest(serverPath.font))
}

const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
}

const browserSyncOption = {
  server: "./_static/dist/"
}

const browserSyncReload = (done) => {
  browserSync.reload();
  done();
}

const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(cssSass))
  // gulp.watch(srcPath.pug, gulp.series(htmlPug))
  gulp.watch(srcPath.html, gulp.series(html, browserSyncReload))
  gulp.watch(srcPath.js, gulp.series(js, browserSyncReload))
  gulp.watch(srcPath.img, gulp.series(imgImagemin, browserSyncReload))
  gulp.watch(srcPath.php, gulp.series(php, browserSyncReload))
  gulp.watch(srcPath.font, gulp.series(font, browserSyncReload))
}


const defaultTask = gulp.series(
  clean,
  gulp.parallel(html, cssSass, js, imgImagemin, php, font),
  gulp.parallel(watchFiles, browserSyncFunc)
);

export default defaultTask
