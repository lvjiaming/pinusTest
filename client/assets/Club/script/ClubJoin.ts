import JoinRoom from "../../Hall/script/JoinRoom";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ClubJoin extends JoinRoom {

    async _sendEnter(clubID: number) {
        let route = 'hall.hallClubHandler.joinClub';
        let res = await vv.pinus.request(route, {
            clubID: clubID
        });
        if (res.status == 0) {
            this.showAlert(res.msg, Alert.Yes, () => {
                this.node.active = false;
            });
        } else {
            this.showAlert(res.msg);
        }
    }
}
