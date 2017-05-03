var nodemon = require("gulp-nodemon"),
  gulp = require("gulp"),
  ts = require("gulp-typescript"),
  conventionalChangelog = require('gulp-conventional-changelog'),
  file = require("gulp-file"),
  path = require('path'),
  tsProject = ts.createProject("tsconfig.json"),
  clean = require("gulp-clean"),
  jasmine = require('gulp-jasmine');


var paths = {
  src: "./src",
  bin: "./bin"
}
 
gulp.task('test', ["build"], () =>
  gulp.src('./bin/**/*[sS]pec.js')
    // gulp-jasmine works on filepaths so you can't have any plugins before it 
    .pipe(jasmine())
);

gulp.task("typescript", ["clean"], () => {
  return gulp.src(path.join(paths.src, "**", "*.ts"))
    .pipe(tsProject())
    .js.pipe(gulp.dest(paths.bin));
});

gulp.task('watch', ['build'], () => {
  nodemon({
    script: path.join(paths.bin, 'cli.js'),
    ext: 'ts js',
    watch: [paths.src],
    tasks: (changedFiles) => {
      var tasks = []
      changedFiles.forEach((file) => {
        // add typescript compilation if a *-ts file was changed
        if (path.extname(file) === '.ts' && !~tasks.indexOf('build')) { 
          tasks.push('build');
        } 
      })
      return tasks
    },
    env: {
      'NODE_ENV': 'development'
    }
  })
});

gulp.task('copycdn', () => {
   gulp.src('./src/cdn/**/**.*')
   .pipe(gulp.dest('./bin/cdn'));
});

gulp.task('copyjson', () => {
   gulp.src('./src/plugins/**/*.json')
   .pipe(gulp.dest('./bin/plugins'));
});

gulp.task('copyPluginData', () => {
   gulp.src('./src/plugins/**/data/*.json')
   .pipe(gulp.dest('./bin/plugins/'));
});

gulp.task('changelog', function () {
  return file("CHANGELOG.md", "", { src: true })
  .pipe(conventionalChangelog({
    preset: 'angular',
    releaseCount: 0
  }, {}, {}, {
    headerPattern: /^(\w*)(?:\(([\w\$\.\-\* ]*)\))?\:? (.*)$/m
  }))
  .pipe(gulp.dest("./")); // or any writable stream
});

gulp.task("build", ["typescript", "copycdn", "copyjson", "copyPluginData"], () => {
  return;
});

gulp.task("clean", () => {
  return gulp.src(path.join(paths.bin, "**", "*.js"))
    .pipe(clean());
});

gulp.task("default", ["build"], () => {
  return;
});