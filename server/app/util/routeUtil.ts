
import { Application, Session } from 'pinus';
import { dispatch } from './dispatcher';

export function chat(session: Session, msg: any, app: Application, cb: (err: Error , serverId ?: string) => void) {
    let chatServers = app.getServersByType('chat');

    if(!chatServers || chatServers.length === 0) {
        cb(new Error('can not find chat servers.'));
        return;
    }

    let res = dispatch(session.get('rid'), chatServers);
    cb(null, res.id);
}

export function hall(session: Session, msg: any, app: Application, cb: (err: Error , serverId ?: string) => void) {
    let hallServers = app.getServersByType('hall');
    if(!hallServers || hallServers.length === 0) {
        cb(new Error('can not find hall servers.'));
        return;
    }

    let res = dispatch(session.uid, hallServers);
    cb(null, res.id);
}

export function game(session: Session, msg: any, app: Application, cb: (err: Error , serverId ?: string) => void) {
    let gameServers = app.getServersByType('game');

    if(!gameServers || gameServers.length === 0) {
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

export function club(session: Session, msg: any, app: Application, cb: (err: Error , serverId ?: string) => void) {
    let clubServers = app.getServersByType('club');

    let clubKey = session.get('clubKey');
    if(!clubServers || clubServers.length === 0) {
        cb(new Error('can not find club servers.'));
        return;
    }
    if (!clubKey) {
        cb(new Error('cant not find clubKey'));
        return;
    }

    let res = dispatch(clubKey + '', clubServers);
    cb(null, res.id);
    return;
}