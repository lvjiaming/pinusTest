"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pinus_1 = require("pinus");
require("./app/servers/user.rpc.define");
const routeUtil = require("./app/util/routeUtil");
const httpServer_1 = require("./app/web/httpServer");
const preload_1 = require("./preload");
const _pinus = require("pinus");
require('./app/util/prototypes');
const filePath = _pinus.FILEPATH;
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
preload_1.preload();
/**
 * Init app for client.
 */
// let model: string = 'production';
let model = 'development|production';
let app = pinus_1.pinus.createApp();
app.set('name', 'csgame');
// app configuration
app.configure(model, 'connector', function () {
    app.set('connectorConfig', {
        connector: pinus_1.pinus.connectors.hybridconnector,
        heartbeat: 3,
    });
});
app.configure(model, 'gate', function () {
    app.set('connectorConfig', {
        connector: pinus_1.pinus.connectors.hybridconnector,
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
    httpServer_1.httpInit();
}
// start app
app.start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQTRCO0FBQzVCLHlDQUF1QztBQUN2QyxrREFBa0Q7QUFDbEQscURBQThDO0FBQzlDLHVDQUFrQztBQUVsQyxnQ0FBaUM7QUFFakMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFHakMsTUFBTSxRQUFRLEdBQUksTUFBYyxDQUFDLFFBQVEsQ0FBQztBQUMxQyxRQUFRLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDO0FBQ25DLFFBQVEsQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7QUFDcEMsUUFBUSxDQUFDLElBQUksR0FBRyxlQUFlLENBQUM7QUFDaEMsUUFBUSxDQUFDLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQztBQUNoQyxRQUFRLENBQUMsYUFBYSxHQUFHLHNCQUFzQixDQUFDO0FBQ2hELFFBQVEsQ0FBQyxhQUFhLEdBQUcsc0JBQXNCLENBQUM7QUFDaEQsUUFBUSxDQUFDLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQztBQUN4QyxRQUFRLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQztBQUNsQyxRQUFRLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQztBQUN0QyxRQUFRLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUVoQyxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7QUFDaEQsYUFBYSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUM7QUFDM0MsYUFBYSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQztBQUM5Qzs7OztHQUlHO0FBQ0gsaUJBQU8sRUFBRSxDQUFDO0FBRVY7O0dBRUc7QUFDSCxvQ0FBb0M7QUFDcEMsSUFBSSxLQUFLLEdBQVcsd0JBQXdCLENBQUM7QUFDN0MsSUFBSSxHQUFHLEdBQUcsYUFBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzVCLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBRTFCLG9CQUFvQjtBQUNwQixHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUU7SUFDOUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFDckI7UUFDSSxTQUFTLEVBQUUsYUFBSyxDQUFDLFVBQVUsQ0FBQyxlQUFlO1FBQzNDLFNBQVMsRUFBRSxDQUFDO0tBR2YsQ0FBQyxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDekIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFDckI7UUFDSSxTQUFTLEVBQUUsYUFBSyxDQUFDLFVBQVUsQ0FBQyxlQUFlO0tBRTlDLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDO0FBRUgsZ0JBQWdCO0FBQ2hCLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO0lBQ2pCLG1CQUFtQjtJQUNuQixxQ0FBcUM7SUFDckMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFbEMsb0JBQW9CO0lBQ3BCLDJDQUEyQztBQUMvQyxDQUFDLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO0lBQ2pCLG9DQUFvQztJQUNwQywrQkFBK0I7QUFDbkMsQ0FBQyxDQUFDLENBQUM7QUFHSCxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtJQUNoQiw2RUFBNkU7SUFDN0UscUJBQVEsRUFBRSxDQUFDO0NBQ2Q7QUFFRCxZQUFZO0FBQ1osR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIn0=