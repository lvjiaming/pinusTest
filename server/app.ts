import {pinus} from 'pinus';
import './app/servers/user.rpc.define';
import * as routeUtil from './app/util/routeUtil';
import {httpInit} from './app/web/httpServer';
import {preload} from './preload';
import * as fs from "fs";
import _pinus = require('pinus');

require('./app/util/prototypes');


const filePath = (_pinus as any).FILEPATH;
filePath.MASTER = '/config/master';
filePath.SERVER = '/config/servers';
filePath.CRON = '/config/crons';
filePath.LOG = '/config/log4js';
filePath.SERVER_PROTOS = '/config/serverProtos';
filePath.CLIENT_PROTOS = '/config/clientProtos';
filePath.MASTER_HA = '/config/masterha';
filePath.LIFECYCLE = '/lifecycle';
filePath.SERVER_DIR = '/app/servers/';
filePath.CONFIG_DIR = '/config';

const adminfilePath = _pinus.DEFAULT_ADMIN_PATH;
adminfilePath.ADMIN_FILENAME = 'adminUser';
adminfilePath.ADMIN_USER = 'config/adminUser';
/**
 *  替换全局Promise
 *  自动解析sourcemap
 *  捕获全局错误
 */
preload();

/**
 * Init app for client.
 */
// let model: string = 'production';
let model: string = 'development|production';
let app = pinus.createApp();
app.set('name', 'csgame');

// app configuration
app.configure(model, 'connector', function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            heartbeat: 3,
            // useDict: true,
            // useProtobuf: true
        });
});

app.configure(model, 'gate', function () {
    app.set('connectorConfig',
        {
            connector: pinus.connectors.hybridconnector,
            // useProtobuf: true
        });
});

// app configure
app.configure(model, function () {
    // route configures
    // app.route('chat', routeUtil.chat);
    app.route('hall', routeUtil.hall);
    app.route('game', routeUtil.game);
    app.route('club', routeUtil.club);

    // filter configures
    // app.filter(new pinus.filters.timeout());
});

app.configure(model, function () {
    // enable the system monitor modules
    // app.enable('systemMonitor');
});


if (app.isMaster()) {
    //   app.use(createRobotPlugin({scriptFile: __dirname + '/robot/robot.js'}));
    httpInit();
}

// start app
app.start();