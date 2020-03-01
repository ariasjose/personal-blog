var gulp        = require('gulp');
var browserSync = require('browser-sync')
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var cssnano 	= require('gulp-cssnano');

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {    
    return gulp.src('assets/scss/style.scss')        
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))        
        .pipe(prefix(['last 3 versions'], { cascade: true }))
        .pipe(cssnano())
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('assets/css'));
});

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {    
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
var reload = function () {    
    browserSync.reload();
};
gulp.task('jekyll-rebuild', gulp.series('jekyll-build', reload));

/**
 * Wait for jekyll-build, then launch the Server
 */
var browserSyncTask = function () {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
    // browserSync.init({
    //     server: {
    //         baseDir: '_site'
    //     }
    // });
};
gulp.task('browser-sync', 
    gulp.series(
        gulp.parallel('sass', 'jekyll-build'),
        browserSyncTask
    )
);

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch(['assets/scss/*.scss', 'assets/scss/*/*.scss'], gulp.series('sass', 'jekyll-rebuild'));
    gulp.watch(['*.html', '_layouts/*.html', '_includes/*.html', '_posts/*'], gulp.parallel('jekyll-rebuild'));    
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', gulp.parallel('browser-sync', 'watch'));
