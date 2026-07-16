const autoprefixer = require('autoprefixer')
const browser = require('browser-sync')
const colors = require('ansi-colors')
const concat = require('gulp-concat')
const csso = require('gulp-csso')
const fancyLog = require('fancy-log')
const gulp = require('gulp')
const gulpSass = require('gulp-sass')
const htmllint = require('gulp-htmllint')
const minHTML = require('gulp-htmlmin')
const mq4HoverShim = require('mq4-hover-shim')
const nodeSass = require('node-sass')
const panini = require('panini')
const postcss = require('gulp-postcss')
const purgecss = require('gulp-purgecss')
const rimraf = require('rimraf').sync
const sitemap = require('gulp-sitemap')
const sourcemaps = require('gulp-sourcemaps')
const streamFinished = require('stream').finished
const uglify = require('gulp-uglify')
const version = require('./package.json').version
const workboxBuild = require('workbox-build')

const assetsPath = 'src/assets/'
const port = process.env.RVW_SERVER_PORT || 8081

const sass = gulpSass(nodeSass)

const waitForStream = (stream) => new Promise((resolve, reject) => {
  streamFinished(stream, (error) => {
    if (error) {
      reject(error)
      return
    }

    resolve()
  })
})

// Theme Scss variables
const scssOptions = {
  errLogToConsole: true,
  outputStyle: 'compressed',
  includePaths: ['./src/scss']
}

// Erases the dist folder
gulp.task('clean', (done) => {
  rimraf('build')
  rimraf('dist')
  done()
})

// Compile HTML
gulp.task('compile-html', () => {
  return gulp
    .src('src/html/pages/**/*.html')
    .pipe(
      panini({
        root: 'src/html/pages/',
        layouts: 'src/html/layouts/',
        partials: 'src/html/includes/',
        helpers: 'src/html/helpers/',
        data: 'src/html/data/'
      })
    )
    .pipe(gulp.dest('dist'))
    .on('finish', browser.reload)
})

gulp.task('compile-html:reset', (done) => {
  panini.refresh()
  done()
})

// Compile js from node modules
// @TODO: Clean up unused code once we finish the site
gulp.task('compile-js', () => {
  const fileName = process.env.NODE_ENV === 'production' ? 'plugins.min.js' : `plugins.${version}.min.js`
  return gulp
    .src([
      `${assetsPath}/js/jquery.min.js`
    ])
    .pipe(uglify())
    .pipe(concat(fileName))
    .pipe(gulp.dest('dist/assets/js/'))
    .on('finish', browser.reload)
})

// Copy static assets
gulp.task('copy', () => {
  const staticFiles = gulp
    .src([
      'src/html/.htaccess',
      'src/html/favicon.ico',
      'src/html/manifest.json',
      'src/html/peter_schmalfeldt.vcf',
      'src/html/oembed.*',
      'src/html/*.txt'
    ])
    .pipe(gulp.dest('dist/'))
  const fontFiles = gulp.src(['src/assets/fonts/**/*']).pipe(gulp.dest('dist/assets/fonts/'))

  return Promise.all([
    waitForStream(staticFiles),
    waitForStream(fontFiles)
  ])
})

// Copy images to production site
gulp.task('copy-images', () => {
  return gulp.src('src/images/**/*').pipe(gulp.dest('dist/assets/images/'))
})

// Compile Service Worker
gulp.task('compile-sw', () => {
  fancyLog(
    `Creating '${colors.cyan('compile-sw')}'... ${colors.dim(
      '( This may take a second )'
    )}`
  )

  const buildSW = () => {
    return workboxBuild.generateSW({
      mode: process.env.NODE_ENV,
      globDirectory: './dist',
      globPatterns: ['**/*.{html,json,js,css}'],
      swDest: './dist/sw.js',
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images'
          }
        }
      ]
    })
  }

  return new Promise((resolve, reject) => {
    setTimeout(function () {
      buildSW().then(resolve).catch(reject)
    }, 5000)
  })
})

// Copy Theme js to production site
gulp.task('copy-js', () => {
  const fileName = process.env.NODE_ENV === 'production' ? 'app.min.js' : `app.${version}.min.js`
  return gulp
    .src('src/js/**/*.js')
    .pipe(uglify())
    .pipe(concat(fileName))
    .pipe(gulp.dest('dist/assets/js/'))
    .on('finish', browser.reload)
})

// Starts a BrowserSync instance
gulp.task('server', (done) => {
  setTimeout(() => {
    browser.init({
      server: {
        baseDir: 'dist',
        serveStaticOptions: {
          extensions: ['html']
        }
      },
      port: port
    })
  }, 3000)

  done()
})

// Generate Sitemap
gulp.task('sitemap', () => {
  return gulp
    .src(['dist/*.html', 'dist/**/*.html'], {
      read: false
    })
    .pipe(
      sitemap({
        siteUrl: 'https://peterschmalfeldt.com',
        changefreq: 'monthly',
        lastmod (file) {
          return file && file.ctime ? file.ctime.toString().trim() : Date.now()
        },
        getLoc (siteUrl, loc, entry) {
          return loc.replace(/\.\w+$/, '')
        }
      })
    )
    .pipe(gulp.dest('./dist'))
})

gulp.task('lint-html', (done) => {
  const reporter = (filepath, issues) => {
    if (issues.length > 0) {
      issues.forEach(function (issue) {
        fancyLog(
          colors.cyan('[lint-html] ') +
            colors.white(
              filepath.replace(__dirname, '.') +
                ' [' +
                issue.line +
                ':' +
                issue.column +
                '] '
            ) +
            colors.red('(' + issue.code + ') ' + issue.msg)
        )
      })

      process.exitCode = 1
    }
  }

  const options = {
    rules: {
      'attr-bans': [],
      'attr-name-style': false,
      'attr-req-value': false,
      'attr-validate': false,
      'class-style': false,
      'doctype-first': false,
      'doctype-html5': true,
      'id-class-no-ad': false,
      'id-class-style': false,
      'id-no-dup': true,
      'img-req-alt': true,
      'indent-width': 2,
      'label-req-for': false,
      'line-end-style': false,
      'line-no-trailing-whitespace': false,
      maxerr: 3,
      'raw-ignore-regex': /<!--[^]*?-->/,
      'spec-char-escape': false,
      'tag-bans': [],
      'tag-close': true,
      'tag-name-match': true,
      'title-max-len': 80
    }
  }

  gulp.src('dist/**/*.html').pipe(htmllint(options, reporter))

  done()
})

// Compile Theme Scss
gulp.task('compile-scss', () => {
  const processors = [
    mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.is-true-hover ' }),
    autoprefixer({
      overrideBrowserslist: [
        'Chrome >= 45',
        'Firefox ESR',
        'Edge >= 12',
        'Explorer >= 10',
        'iOS >= 9',
        'Safari >= 9',
        'Android >= 4.4',
        'Opera >= 30'
      ]
    })
  ]

  let stream

  if (process.env.NODE_ENV === 'production') {
    stream = gulp
      .src('./src/scss/style.scss')
      .pipe(sass(scssOptions).on('error', sass.logError))
      .pipe(postcss(processors))
      .pipe(concat('style.css'))
      .pipe(gulp.dest('src/assets/css/'))
  } else {
    stream = gulp
      .src('./src/scss/style.scss')
      .pipe(sourcemaps.init())
      .pipe(sass(scssOptions).on('error', sass.logError))
      .pipe(postcss(processors))
      .pipe(sourcemaps.write())
      .pipe(concat('style.css'))
      .pipe(gulp.dest('src/assets/css/'))
  }

  return stream.on('finish', browser.reload)
})

// Compile css from node modules
gulp.task('compile-css', () => {
  const fileName = process.env.NODE_ENV === 'production' ? 'style.min.css' : `style.${version}.min.css`
  return gulp
    .src([
      'src/assets/css/bootstrap.css',
      'src/assets/css/ionicons.css',
      'src/assets/css/style.css'
    ])
    .pipe(csso())
    .pipe(concat(fileName))
    .pipe(gulp.dest('build'))
})

gulp.task('purge-css', () => {
  return gulp
    .src(['build/*.css'])
    .pipe(
      purgecss({
        content: ['dist/*.html', 'src/js/**/*.js']
      })
    )
    .pipe(gulp.dest('dist/assets/css/'))
})

gulp.task('min-html', () => {
  if (process.env.NODE_ENV === 'production') {
    return gulp
      .src('dist/*.html')
      .pipe(minHTML({
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true,
        removeComments: true,
        maxLineLength: 10000
      }))
      .pipe(gulp.dest('dist'))
  }

  return Promise.resolve()
})

// Watch files for changes
gulp.task('watch', (done) => {
  gulp.watch(
    'src/scss/*',
    gulp.series('compile-html:reset', 'compile-html', 'compile-scss', 'compile-css', 'purge-css')
  )
  gulp.watch(
    'src/js/**/*',
    gulp.series('compile-html:reset', 'compile-html', 'copy-js')
  )
  gulp.watch('src/images/**/*', gulp.series('copy-images'))
  gulp.watch('src/html/pages/**/*', gulp.series('compile-html'))
  gulp.watch(
    ['src/html/{layouts,includes,helpers,data}/**/*'],
    gulp.series('compile-html:reset', 'compile-html')
  )
  gulp.watch(
    ['src/html/{layouts,partials,helpers,data}/**/*'],
    gulp.series(panini.refresh)
  )

  done()
})

// Main Gulp Tasks
gulp.task(
  'build',
  gulp.series(
    'clean',
    'copy',
    'compile-scss',
    'compile-css',
    'compile-js',
    'copy-js',
    'compile-html',
    'copy-images',
    'compile-sw',
    'purge-css',
    'min-html'
  )
)
gulp.task('default', gulp.series('build', 'watch', 'server'))
