import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const spawnPromise = (command: string) => {
    console.log(command);
    return new Promise((resolve, reject) => {
        const sp = spawn('cmd', ['/c', command]);
        sp.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        sp.on('error', (err) => {
            reject(err);
        });
        sp.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(code);
            }
        });
    });
};

const projName = process.argv[2];

if (!projName || !/^[a-zA-Z0-9_]*$/.test(projName)) {
    throw new Error('引数が無いか、書式エラーです。/^[a-zA-Z0-9_]*$/');
}

const libs = [
    'native-base',
    'react-navigation',
    'react-native-device-info',
    'redux',
    'react-redux',
    'uuid',
    'clone',
    'moment',
];

const types = [
    'react',
    'react-native',
    'react-navigation',
    'redux',
    'react-redux',
    'uuid',
    'clone',
];

const atTypes = types.map((it) => '@types/' + it);

const devLibs = [
    'typescript',
    'tslint',
    'react-native-typescript-transformer',
];

const commands = {
    addDevLibs: 'yarn add --dev ' + [...devLibs, ...atTypes].join(' '),
    addLibs: 'yarn add ' + libs.join(' '),
    createTsLintConfig: 'yarn tslint --init',
    createTsconfig: 'yarn tsc --init --target ES6 --sourceMap --allowSyntheticDefaultImports --inlineSources',
    reactNativeInit: `react-native.cmd init ${projName} --version=0.55.3`,
    reactNativeLink: 'yarn react-native link',
};

const projPath = path.join(process.cwd(), projName);

spawnPromise(commands.reactNativeInit)
    .then(() => {
        const rncliConfig = `module.exports = {
    getTransformModulePath() {
        return require.resolve("react-native-typescript-transformer");
    },
    getSourceExts() {
        return ["ts", "tsx"];
    }
};`;

        fs.writeFile(path.join(projPath, 'rn-cli.config.js'), rncliConfig, (err) => {
            if (err) { console.error(err); }
        });
    })
    .then(() => {
        process.chdir(projPath);
        console.log(process.cwd());
        return spawnPromise(commands.addLibs);
    })
    .then(() => {
        return spawnPromise(commands.addDevLibs);
    })
    .then(() => {
        return Promise.all([
            spawnPromise(commands.reactNativeLink),
            spawnPromise(commands.createTsconfig),
            spawnPromise(commands.createTsLintConfig),
        ]);
    })
    .then(() => {
        const tsConfigPath = path.join(projPath, 'tsconfig.json');
        console.log('tsConfigPath ' + tsConfigPath);
        let tsconfig = fs.readFileSync(tsConfigPath, { encoding: 'utf-8' });
        const addItem = `},
  "exclude": [
    "node_modules"
  ]`;
        tsconfig = tsconfig.replace(/^\s\s\}$/m, addItem);
        fs.writeFile(tsConfigPath, tsconfig, (err) => {
            if (err) { console.error(err); }
        });
    })
    .then(() => {
        fs.mkdirsSync(path.join(projPath, 'src', 'action'));
        return Promise.all([
            fs.mkdirs(path.join(projPath, 'src', 'components')),
            fs.mkdirs(path.join(projPath, 'src', 'reducers')),
            fs.mkdirs(path.join(projPath, 'src', 'states')),
        ]);
    })
    .then(() => {
        fs.move(
            path.join(projPath, 'App.js'),
            path.join(projPath, 'src', 'components', 'App.js'));

    })
    .then(() => {
        let indexjs = fs.readFileSync(path.join(projPath, 'index.js'), { encoding: 'utf-8' });
        indexjs = indexjs.replace(/^import App from '\.\/App';$/m, 'import App from \'\./src/components/App\';');
        return fs.writeFile(path.join(projPath, 'index.js'), indexjs);
    })
    .catch((reason) => {
        console.log(reason);
    });
