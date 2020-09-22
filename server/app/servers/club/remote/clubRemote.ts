import { Application } from 'pinus';
import { DBManager } from './../../../repositories/dbManager';


export default function (app: Application) {
    return new ClubRemote(app);
}

export class ClubRemote {

    constructor(private app: Application) {
    }

    add(clubKey: number, uid: string, sid: string) {
        let channel = this.app.get('channelService').getChannel(clubKey + '', true);
        if (!!channel) {
            if (!channel.getMember(uid))
                channel.add(uid, sid);
        }
    }

    async updateRoom(clubKey: number) {
        let channel = this.app.get('channelService').getChannel(clubKey + '');
        if (!!channel) {
            let roomInfo = await DBManager.get().clubDB.getClubRoom(clubKey);
            for (let info of roomInfo) {
                let ret = await this.app.rpc.game.gameRemote.getSitUser.toServer(<string>(info.ServerID), <any>(info.RoomID));
                info.users = ret ? ret : [];
            }
            console.log('onUpdateRoom');
            channel.pushMessage('onUpdateRoom', {clubKey: clubKey, roomInfo: roomInfo});
        }
    }

    async updateRequire(clubKey: number) {
        let channel = this.app.get('channelService').getChannel(clubKey + '');
        if (!!channel) {
            let require = await DBManager.get().clubDB.getRequiredMembers(clubKey);
            channel.pushMessage('onUpdateRequire', {clubKey: clubKey, require: require});
        }
    }

    async updateRoomInfo(clubKey: number, roomInfo: any, users: any) {
        let channel = this.app.get('channelService').getChannel(clubKey + '');
        if (!!channel) {
            roomInfo.users = users;
            channel.pushMessage('onUpdateRoomInfo', roomInfo);
        }
    }

    public async leave(uid: string, sid: string, clubKey: number) {
        let channel = this.app.get('channelService').getChannel(clubKey + '');
        if (!!channel) {
            channel.leave(uid, sid);
        }
    }
}
