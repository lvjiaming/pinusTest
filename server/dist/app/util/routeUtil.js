"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.club = exports.game = exports.hall = exports.chat = void 0;
const dispatcher_1 = require("./dispatcher");
function chat(session, msg, app, cb) {
    let chatServers = app.getServersByType('chat');
    if (!chatServers || chatServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }
    let res = dispatcher_1.dispatch(session.get('rid'), chatServers);
    cb(null, res.id);
}
exports.chat = chat;
function hall(session, msg, app, cb) {
    let hallServers = app.getServersByType('hall');
    if (!hallServers || hallServers.length === 0) {
        cb(new Error('can not find hall servers.'));
        return;
    }
    let res = dispatcher_1.dispatch(session.uid, hallServers);
    cb(null, res.id);
}
exports.hall = hall;
function game(session, msg, app, cb) {
    let gameServers = app.getServersByType('game');
    if (!gameServers || gameServers.length === 0) {
        cb(new Error('can not find game servers.'));
        return;
    }
    for (var i in gameServers) {
        if (gameServers[i].id == session.get('ServerID')) {
            cb(null, gameServers[i].id);
            return;
        }
    }
    // cb(new Error('can not find game servers.'));
    return;
}
exports.game = game;
function club(session, msg, app, cb) {
    let clubServers = app.getServersByType('club');
    let clubKey = session.get('clubKey');
    if (!clubServers || clubServers.length === 0) {
        cb(new Error('can not find club servers.'));
        return;
    }
    if (!clubKey) {
        cb(new Error('cant not find clubKey'));
        return;
    }
    let res = dispatcher_1.dispatch(clubKey + '', clubServers);
    cb(null, res.id);
    return;
}
exports.club = club;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVVdGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3V0aWwvcm91dGVVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLDZDQUF3QztBQUV4QyxTQUFnQixJQUFJLENBQUMsT0FBZ0IsRUFBRSxHQUFRLEVBQUUsR0FBZ0IsRUFBRSxFQUE2QztJQUM1RyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFL0MsSUFBRyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQzVDLE9BQU87S0FDVjtJQUVELElBQUksR0FBRyxHQUFHLHFCQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNwRCxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBVkQsb0JBVUM7QUFFRCxTQUFnQixJQUFJLENBQUMsT0FBZ0IsRUFBRSxHQUFRLEVBQUUsR0FBZ0IsRUFBRSxFQUE2QztJQUM1RyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsSUFBRyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQzVDLE9BQU87S0FDVjtJQUVELElBQUksR0FBRyxHQUFHLHFCQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUM3QyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBVEQsb0JBU0M7QUFFRCxTQUFnQixJQUFJLENBQUMsT0FBZ0IsRUFBRSxHQUFRLEVBQUUsR0FBZ0IsRUFBRSxFQUE2QztJQUM1RyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFL0MsSUFBRyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUN6QyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1FBQzVDLE9BQU87S0FDVjtJQUNELEtBQUssSUFBSSxDQUFDLElBQUksV0FBVyxFQUFFO1FBQ3ZCLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzlDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLE9BQU87U0FDVjtLQUNKO0lBQ0QsK0NBQStDO0lBQy9DLE9BQU87QUFDWCxDQUFDO0FBZkQsb0JBZUM7QUFFRCxTQUFnQixJQUFJLENBQUMsT0FBZ0IsRUFBRSxHQUFRLEVBQUUsR0FBZ0IsRUFBRSxFQUE2QztJQUM1RyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFL0MsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyQyxJQUFHLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3pDLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDNUMsT0FBTztLQUNWO0lBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNWLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7UUFDdkMsT0FBTztLQUNWO0lBRUQsSUFBSSxHQUFHLEdBQUcscUJBQVEsQ0FBQyxPQUFPLEdBQUcsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzlDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pCLE9BQU87QUFDWCxDQUFDO0FBaEJELG9CQWdCQyJ9