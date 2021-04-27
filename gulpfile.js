//let replace = require('gulp-replace'); //.pipe(replace('bar', 'foo'))
let { src, dest } = require("gulp");

let del = require("del");
let gulp = require("gulp");
let newer = require("gulp-newer");
let rename = require("gulp-rename");
let plumber = require("gulp-plumber");
let uglify = require("gulp-uglify-es").default;
let imagemin = require("gulp-imagemin");
let fileinclude = require("gulp-file-include");
let browsersync = require("browser-sync").create();

// Css
let scss = require("gulp-sass");
let clean_css = require("gulp-clean-css");
let autoprefixer = require("gulp-autoprefixer");
let group_media = require("gulp-group-css-media-queries");

// Fonts
let fs = require("fs");
let fonter = require("gulp-fonter");
let ttf2woff = require("gulp-ttf2woff");
let ttf2woff2 = require("gulp-ttf2woff2");

// Folders
let dist_folder = "dist"; // require("path").basename(__dirname)
let src_folder = "#src";

// Paths
let path = {
	build: {
		images: dist_folder + "/img/",
		fonts: dist_folder + "/fonts/",
		html: dist_folder + "/",
		css: dist_folder + "/css/",
		js: dist_folder + "/js/",
	},
	src: {
		favicon: src_folder + "/img/favicon.{jpg,png,svg,gif,ico,webp}",
		images: [src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}", "!**/favicon.*"],
		fonts: src_folder + "/fonts/*.ttf",
		html: [src_folder + "/html/*.html", "!" + src_folder + "/html/_*.html"],
		css: src_folder + "/scss/style.scss",
		js: src_folder + "/js/script.js",
	},
	watch: {
		images: src_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
		html: src_folder + "/html/**/*.html",
		css: src_folder + "/scss/**/*.scss",
		js: src_folder + "/js/**/*.js",
	},
	clean: "./" + dist_folder + "/",
};

/*!
 * Browser sync
 */
function browserSync(done) {
	browsersync.init({
		server: {
			baseDir: "./" + dist_folder + "/",
		},
		notify: false,
		port: 3000,
	});
}

/*!
 * HTML
 */
function html() {
	return src(path.src.html, {})
    .pipe(plumber())
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream()
  );
}

/*!
 * CSS
 */
function css() {
	return src(path.src.css, {})
		.pipe(plumber())
		.pipe(
			scss({
				outputStyle: "expanded",
			})
		)
		.pipe(group_media())
		.pipe(
			autoprefixer({
				grid: true,
				overrideBrowserslist: ["last 5 versions"],
				cascade: true,
			})
		)
		.pipe(dest(path.build.css))
		.pipe(clean_css())
		.pipe(
			rename({
				extname: ".min.css",
			})
		)
		.pipe(dest(path.build.css))
		.pipe(browsersync.stream());
}

/*!
 * JS
 */
function js() {
	return src(path.src.js, {})
		.pipe(plumber())
		.pipe(fileinclude())
		.pipe(gulp.dest(path.build.js))
		.pipe(uglify(/* options */))
		.on("error", function (err) {
			console.log(err.toString());
			this.emit("end");
		})
		.pipe(
			rename({
				suffix: ".min",
				extname: ".js",
			})
		)
		.pipe(dest(path.build.js))
		.pipe(browsersync.stream());
}

/*!
 * Images
 */
function images() {
	return src(path.src.images)
		.pipe(newer(path.build.images))
		.pipe(dest(path.build.images))
		.pipe(src(path.src.images))
		.pipe(newer(path.build.images))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3, // 0 to 7
			})
		)
		.pipe(dest(path.build.images));
}

/*!
 * Favicon
 */
function favicon() {
	return src(path.src.favicon)
		.pipe(plumber())
		.pipe(
			rename({
				extname: ".ico",
			})
		)
		.pipe(dest(path.build.html));
}

/*!
 * FONTS
 */
function fonts_otf() {
	return src("./" + src_folder + "/fonts/*.otf")
		.pipe(plumber())
		.pipe(
			fonter({
				formats: ["ttf"],
			})
		)
		.pipe(gulp.dest("./" + src_folder + "/fonts/"));
}

function fonts() {
	src(path.src.fonts).pipe(plumber()).pipe(ttf2woff()).pipe(dest(path.build.fonts));
	return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts)).pipe(browsersync.stream());
}

function fontstyle() {
	let file_content = fs.readFileSync(src_folder + "/scss/misc/fonts.scss");
	if (file_content == "") {
		fs.writeFile(src_folder + "/scss/misc/fonts.scss", "", cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split(".");
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(src_folder + "/scss/misc/fonts.scss", '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		});
	}
}

function cb() {

}

/*!
 * Clean dist
 */
function clean() {
	return del(path.clean);
}

/*!
 * Watch
 */
function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.images], images);
}

let build = gulp.series(clean, fonts_otf, gulp.parallel(html, css, js, favicon, images), fonts, fontstyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.html = html;
exports.css = css;
exports.js = js;
exports.favicon = favicon;
exports.fonts_otf = fonts_otf;
exports.fontstyle = fontstyle;
exports.fonts = fonts;
exports.images = images;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
