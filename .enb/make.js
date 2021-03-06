const includeYM = false; // подключать js-модули i-bem
const isBeautify = true; // использовать htmlBeautify
const winDir = !!process.env.WINDIR; // проверка на Windows

const techs = {
        // essential
        fileProvider: require('enb/techs/file-provider'),
        fileMerge: require('enb/techs/file-merge'),

        // optimization
        borschik: require('enb-borschik/techs/borschik'),

        // css
        stylus: require('enb-stylus/techs/stylus'),

        // js
        browserJs: require('enb-js/techs/browser-js'),

        // bemtree
        // bemtree: require('enb-bemxjst/techs/bemtree'),

        // bemhtml
        bemhtml: require('enb-bemxjst/techs/bemhtml'),
        bemjsonToHtml: require('enb-bemxjst/techs/bemjson-to-html'),

        // beautify-html
        htmlBeautify: require('enb-beautify/techs/enb-beautify-html')
    };

const enbBemTechs = require('enb-bem-techs');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const yandexLevels = [
    { path: 'node_modules/bem-core/common.blocks', check: false },
    { path: 'node_modules/bem-core/desktop.blocks', check: false },
    // отключаем компоненты Яндекса
    //{ path: 'node_modules/bem-components/common.blocks', check: false },
    //{ path: 'node_modules/bem-components/desktop.blocks', check: false },
    //{ path: 'node_modules/bem-components/design/common.blocks', check: false },
    //{ path: 'node_modules/bem-components/design/desktop.blocks', check: false },
];
const devLevels = [
    'common.blocks',
    'desktop.blocks'
]

if(!includeYM) {
    devLevels.push('system.blocks');
}

const levels = includeYM ? [...yandexLevels, ...devLevels] : devLevels;

const createDir = (name) => {
    if (!fs.existsSync(name)) {
        fs.mkdirSync(name);
    }
}

const woff2base64 = (path) => {
    return `data:application/font-woff;charset=utf-8;base64,${fs.readFileSync(path, {encoding: 'base64'})}`;
};

const fontBase64 = (path) => {
    const fontsPath = 'build/fonts';
    const woff = [];
    const base64 = [];

    let file = fs.readFileSync(path, 'utf-8');
    const files = fs.readdirSync(fontsPath);

    for(let key in files) {
        const name = files[key];
        if(name.match(/\.woff$/)) {
            woff.push(name);
        }
    }

    woff.map( fileName => {
        const reg = new RegExp(`\.\./fonts/${fileName}`, 'g');
        file = file.replace(reg, woff2base64(`${fontsPath}/${fileName}`));
    });

    fs.writeFileSync(path, file);
};

const make = (config) => {
    const isProd = process.env.YENV === 'production';

    config.nodes('desktop.bundles/*', (nodeConfig) => {
        const node = path.basename(nodeConfig.getPath());
        if (node !== 'merged') {
            nodeConfig.addTechs([
                // essential
                [enbBemTechs.levels, {levels}],
                [techs.fileProvider, {target: '?.bemjson.js'}],
                [enbBemTechs.bemjsonToBemdecl],
                [enbBemTechs.deps],
                [enbBemTechs.files],

                // css
                [techs.stylus],

                // bemtree
                // [techs.bemtree, { sourceSuffixes: ['bemtree', 'bemtree.js'] }],

                // bemhtml
                [techs.bemhtml, {
                    sourceSuffixes: ['bemhtml', 'bemhtml.js'],
                    forceBaseTemplates: true,
                    engineOptions: {elemJsInstances: true}
                }],

                // html
                [techs.bemjsonToHtml],

                // client bemhtml
                [enbBemTechs.depsByTechToBemdecl, {
                    target: '?.bemhtml.bemdecl.js',
                    sourceTech: 'js',
                    destTech: 'bemhtml'
                }],
                [enbBemTechs.deps, {
                    target: '?.bemhtml.deps.js',
                    bemdeclFile: '?.bemhtml.bemdecl.js'
                }],
                [enbBemTechs.files, {
                    depsFile: '?.bemhtml.deps.js',
                    filesTarget: '?.bemhtml.files',
                    dirsTarget: '?.bemhtml.dirs'
                }],
                [techs.bemhtml, {
                    target: '?.browser.bemhtml.js',
                    filesTarget: '?.bemhtml.files',
                    sourceSuffixes: ['bemhtml', 'bemhtml.js'],
                    engineOptions: {elemJsInstances: true}
                }],

                // js
                [techs.browserJs, {includeYM}],
                [techs.fileMerge, {
                    target: '?.js',
                    sources: ['?.browser.js', '?.browser.bemhtml.js']
                }],

                // beauty.html
                // для того чтобы файл появился в bundles необходимо выполнить команду:
                //  ./node_modules/.bin/enb make
                [techs.htmlBeautify],

                // borschik
                [techs.borschik, {source: '?.js', target: '?.min.js', minify: isProd}],
                [techs.borschik, {source: '?.css', target: '?.min.css', minify: isProd}],
            ]);

            const targets = ['?.html', '?.min.css', '?.min.js'];
            if(isProd || isBeautify) {
                targets.push('?.beauty.html');
            }

            nodeConfig.addTargets(targets);
        }
    });

    // Для продакшена объединяем бандлы
    if(isProd) {
        const dirSep = winDir ? '\\' : '/'; // для Windows \\ для других систем /
        // Создаем директории для merged-бандлов если не создана (1)
        createDir(`desktop.bundles${dirSep}merged`);

        // Настраиваем сборку merged-бандла
        config.nodes(`*.bundles${dirSep}merged`, function (nodeConfig) {

            const dir = 'desktop.bundles';
            const bundles = fs.readdirSync(dir);
            const bemdeclFiles = [];

            // Копируем BEMDECL-файлы в merged-бандл (3)
            bundles.forEach(function (bundle) {
                if (bundle === 'merged' || bundle.match(/^\./gi)) return;

                const node = `${dir}${dirSep}${bundle}`;
                const target = `${bundle}.bemdecl.js`;

                nodeConfig.addTechs([
                    [enbBemTechs.provideBemdecl, { node , target }]
                ]);

                bemdeclFiles.push(target);
            });


            // Объединяем скопированные BEMDECL-файлы (4)
            nodeConfig.addTechs([
                [enbBemTechs.mergeBemdecl, { sources: bemdeclFiles }]
            ]);

            // Обычная сборка бандла (5)
            nodeConfig.addTechs([
                [enbBemTechs.levels, { levels }],
                [enbBemTechs.deps],
                [enbBemTechs.files],
                [techs.stylus, {autoprefixer: true}],
                [techs.browserJs, { target: '?.js', includeYM }],
                [techs.borschik, {source: '?.js', target: '?.min.js', minify: true}],
                [techs.borschik, { source: '?.css', target: '?.min.css', minify: true }],
                [techs.borschik, { source: '?.css', target: '?.dist.css', minify: false }]
            ]);

            nodeConfig.addTargets(['?.min.css', '?.dist.css', '?.js', '?.min.js']);
        });
    }
};

const replaceContentAndCopyFile = (params, callback=()=>{}) => {
    const {from='', to='', replaceContent=[]} = params;
    if(from === '' || to === '') return false;

    fs.readFile(from, (err, content) => {
        if(!err) {
            content = content.toString();
            replaceContent.map(({search, replace}) => {
                content = content.split(search).join(replace);
            });

            fs.open(to, "w", 0o644, (err, handle) => {
                if(!err) {
                    fs.write(handle, content, function(err, result) {
                        if(err)  { console.log('error', err); }
                        else { callback(); }
                    });
                }
            })
        }
    });
}

const copyFile = (from, to) => {
    if (fs.existsSync(from)) {
        fs.createReadStream(from).pipe(fs.createWriteStream(to));
    }
}

const createBuildDir = (buildInfo) => {
    createDir('assets');
    createDir('build');
    createDir('build/css');
    createDir('build/js');
    createDir('build/img');

    copyFile('desktop.bundles/merged/merged.js', 'build/js/scripts.js');
    copyFile('desktop.bundles/merged/merged.min.js', 'build/js/scripts.min.js');

    fs.readdirSync('assets').map(dir => {
        if (dir.match(/^\./gi)) return;
        fse.copySync(`assets/${dir}`, `build/${dir}`);
    });

    // Копируем BEMDECL-файлы в merged-бандл (3)
    const bundlesDir = 'desktop.bundles';
    fs.readdirSync(bundlesDir).map(bundle =>{
        if (bundle === 'merged' || bundle.match(/^\./gi)) return;

        const version = (new Date()).getTime();
        replaceContentAndCopyFile({
            from: `${bundlesDir}/${bundle}/${bundle}.beauty.html`,
            to: `build/${bundle}.html`,
            replaceContent: [
                {search: `${bundle}.min.css`, replace: "css/styles.css?v"+version},
                {search: `${bundle}.min.js`, replace: "js/scripts.js?v"+version},
                {search: "../../../assets/", replace: ""}
            ]
        });

    });

    // Подставляем корректные адреса для изображений в стилях
    ['merged.dist.css', 'merged.min.css'].map(file => {
        const xref = {
            'merged.dist.css': 'build/css/styles.css',
            'merged.min.css': 'build/css/styles.min.css'
        };

        replaceContentAndCopyFile({
            from: `desktop.bundles/merged/${file}`,
            to: `${xref[file]}`,
            replaceContent: [
                {search: "../../build/img/", replace: "../img/"},
                {search: "../../build/fonts/", replace: "../fonts/"}
            ]
        }, () => {
            fontBase64(xref[file]);
        });

    });
};

module.exports = (config) => {
    make(config);

    const initDist = (code)=> {
        config.task(code, (task) => {
            const bundles = glob.sync('*.bundles/*');
            const dirs = winDir === undefined ? bundles : {};
            if(winDir) {
                for (let line in bundles) {
                    dirs[line] = `./${bundles[line]}`;
                }
            }

            return task.buildTargets(dirs)
                .then( buildInfo => createBuildDir(buildInfo));

        });
    }

    ['dist','pack'].map( code => initDist(code));
};
