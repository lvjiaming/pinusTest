import { Application, BackendSession } from 'pinus';
import { GameService } from '../service/gameService';
import { CTable } from './../../../game/table';



export default function (app: Application) {
    return new GameHandler(app);
}

export interface Room {
    Table: CTable
}

export class GameHandler {

    constructor(private app: Application) {
    }

    async enter(msg: IRoomBaseInfo, session: BackendSession) {
        let table = GameService.getTable(msg.RoomID, this.app);
        if (!table) return;
        let res: boolean = await table.enterRoom(parseInt(session.uid), session, msg.GPSInfo);
        if (!res) {
            console.log('进入房间失败!');
        } else {
            session.set('RoomID', msg.RoomID + '');
            session.push('RoomID', function (err) {
                if (err) {
                    console.error('set rid for session service failed! error is : %j', err.stack);
                }
            });
        }
    }

    async onFrameMsg(msg: IGameMsg, session: BackendSession) {
        console.log("frameMsg", msg);
        let roomID = session.get('RoomID');
        if (!roomID) {
            console.log('session 中无 RoomID!');
            return;
        }
        let table: any = GameService.getTable(parseInt(roomID), this.app);
        if (table == null) return;
        if (table[msg.route]) {
            table[msg.route](parseInt(session.uid), msg.data);
        } else {
            console.log('框架无 ' + msg.route + ' 接口');
        }

    }

    async onGameMsg(msg: IGameMsg, session: BackendSession) {
        console.log("消息入口：", msg);
        let roomID = session.get('RoomID');
        if (!roomID) {
            console.log('session 中无 RoomID!');
            return;
        }
        let table = GameService.getTable(parseInt(roomID), this.app);
        if (table == null) return;
        table.onGameMsg(parseInt(session.uid), msg.route, msg.data);
    }
}
