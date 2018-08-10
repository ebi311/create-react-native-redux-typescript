const {
    spawn
} = require('child_process');
const fs = require('fs');
const path = require('path');

const spawnPromise = (command) => {
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
    throw '引数が無いか、書式エラーです。/^[a-zA-Z0-9_]*$/';
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

const atTypes =  types.map((it) => '@types/' + it);

const devLibs = [
    'typescript',
    'tslint',
    'react-native-typescript-transformer',
];



const commands = {
    reactNativeInit: `react-native.cmd init ${projName} --version=0.55.3`,
    addLibs: 'yarn add ' + libs.join(' '),
    addDevLibs: 'yarn add --dev ' + [...devLibs, ...atTypes].join(' '),
    reactNativeLink: 'yarn react-native link',
};

spawnPromise(commands.reactNativeInit)
    .then(() => {
        process.chdir('./' + projName);
        console.log(process.cwd());
        return spawnPromise(commands.addLibs);
    })
    .then(()=>{
        return spawnPromise(commands.addDevLibs);
    })
    .then(() => {
        return spawnPromise(commands.reactNativeLink);
    })
    .catch((reason)  => {
        console.log(reason);
    });

// rn-cli.config.js を作成する

const rncliConfig =
`module.exports = {
    getTransformModulePath() {
        return require.resolve("react-native-typescript-transformer");
    },
    getSourceExts() {
        return ["ts", "tsx"];
    }
};`;

fs.writeFile(path.join(process.cwd(), 'rn-cli.config.js'), rncliConfig, (err) => {
    if (err) { console.error(err); }
});
