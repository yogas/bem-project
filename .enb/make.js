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
const js = require('enb-js/techs/browser-js.js');
const fs = require('fs');
const fse = require('fs-extra');

const levels = [
    { path: 'node_modules/bem-core/common.blocks', check: false },
    { path: 'node_modules/bem-core/desktop.blocks', check: false },
    // отключаем компоненты Яндекса
    //{ path: 'node_modules/bem-components/common.blocks', check: false },
    //{ path: 'node_modules/bem-components/desktop.blocks', check: false },
    //{ path: 'node_modules/bem-components/design/common.blocks', check: false },
    //{ path: 'node_modules/bem-components/design/desktop.blocks', check: false },
    'common.blocks',
    'desktop.blocks'
];

const createDir = (name) => {
    if (!fs.existsSync(name)) {
        fs.mkdirSync(name);
    }
}

const make = (config) => {
    const isProd = process.env.YENV === 'production';

    config.nodes('desktop.bundles/*', (nodeConfig) => {
        const node = path.basename(nodeConfig.getPath());
        if (node !== 'merged') {
            nodeConfig.addTechs([
                // essential
                [enbBemTechs.levels, {levels: levels}],
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
                [techs.browserJs, {includeYM: true}],
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

            const targets = [ '?.html', '?.min.css', '?.min.js'];
            if(isProd) {
                targets.push('?.beauty.html');
            }

            nodeConfig.addTargets(targets);
        }
    });

    // Для продакшена объединяем бандлы
    if(isProd) {
        // Создаем директории для merged-бандлов если не создана (1)
        createDir('desktop.bundles/merged');

        // Настраиваем сборку merged-бандла
        config.nodes('*.bundles/merged', function (nodeConfig) {

            const dir = 'desktop.bundles';
            const bundles = fs.readdirSync(dir);
            const bemdeclFiles = [];

            // Копируем BEMDECL-файлы в merged-бандл (3)
            bundles.forEach(function (bundle) {
                if (bundle === 'merged' || bundle.match(/^\./gi)) return;

                const node = `${dir}/${bundle}`;
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
                [enbBemTechs.levels, { levels: ['desktop.blocks','common.blocks'] }],
                [enbBemTechs.deps],
                [enbBemTechs.files],
                [techs.stylus, {autoprefixer: true}],
                [js, { target: '?.js' }],
                [techs.borschik, {source: '?.js', target: '?.min.js', minify: true}],
                [techs.borschik, { source: '?.css', target: '?.min.css', minify: true }],
                [techs.borschik, { source: '?.css', target: '?.dist.css', minify: false }]
            ]);

            nodeConfig.addTargets(['?.min.css', '?.dist.css', '?.js', '?.min.js']);
        });
    }
};

const replaceContentAndCopyFile = (params) => {
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
                        if(err) console.log('error', err);
                    });
                }
            })
        }
    });
}

const createBuildDir = (buildInfo) => {
    createDir('assets');
    createDir('build');
    createDir('build/css');
    createDir('build/js');
    createDir('build/img');

    fs.createReadStream('desktop.bundles/merged/merged.js').pipe(fs.createWriteStream('build/js/scripts.js'));
    fs.createReadStream('desktop.bundles/merged/merged.min.js').pipe(fs.createWriteStream('build/js/scripts.min.js'));

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
                {search: "../../../assets/css/", replace: "css/"},
                {search: "../../../assets/img/", replace: "img/"},
                {search: "../../../assets/js/", replace: "js/"},
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
                {search: "../../fonts/img/", replace: "../fonts/"}
            ]
        });

    });
};

module.exports = (config) => {
    make(config);

    config.task('dist', (task) => {
        return task.buildTargets(glob.sync('*.bundles/*'))
            .then( buildInfo => createBuildDir(buildInfo));

    });
};
