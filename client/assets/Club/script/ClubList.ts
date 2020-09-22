import ActionClass from "../../Common/script/ActionClass";
import ClubInfo from "./ClubInfo";
import ClubListItem from "./ClubListItem";

const { ccclass, property } = cc._decorator;

interface IClubBaseInfo {
    ClubKey: number;
    ClubID: number;
    ClubName: string;
    MemberCount: number;
    TableCnt: number;
}

@ccclass
export default class ClubList extends ActionClass {

    @property(cc.Node)
    layout: cc.Node = null;

    currentClubInfo: ClubInfo;

    onLoad() {
        this.on(['onAddClub'])
    }

    public async onShowView() {
        let route = 'hall.hallClubHandler.getClubList';
        let res = await vv.pinus.request(route, {});
        this.layout.children.forEach(node => node.active = false);
        res.forEach(data => this.onAddClub(data));
        this.$('_NoClub').active = res.length == 0;
    }

    onAddClub(data) {
        let node = this.layout.children[this._getItemCnt()] || cc.instantiate(this.layout.children[0]);
        node.parent = this.layout;
        let js = node.getComponent(ClubListItem);
        js.setView(data);
        js.m_Hook = this;
        this.$('_NoClub').active = false;
    }

    _getItemCnt() {
        let cnt = 0;
        this.layout.children.forEach(node => {
            if (node.active) cnt++;
        });
        return cnt;
    }

    _onBtMore() {
        this.showPrefab('ClubWelcome');
    }

    updateNoClub() {
        let show = true;
        for (let node of this.layout.children) {
            if (node.active) {
                show = false;
                break;
            }
        }
        this.$('_NoClub').active = show;
    }

    async _onBtItem(event: cc.Component.EventHandler) {
        let js = event.target.getComponent(ClubListItem);
        if (js.getComponent(cc.Toggle).isChecked == true) {
            this.currentClubInfo.node.active = false;
            this.currentClubInfo = null;
            return;
        }
        let res = await vv.pinus.request('hall.hallClubHandler.enterClub', {
            clubKey: js.clubKey
        });
        this.currentClubInfo = await this.showPrefab<ClubInfo>('ClubInfo');
    }

    public async onHideView() {
        if (this.currentClubInfo) {
            this.currentClubInfo.hideView();
            this.currentClubInfo = null;
        }
        this.layout.children.forEach(node => node.getComponent(cc.Toggle).isChecked = false);
        // let res = await vv.pinus.request('club.clubHandler.leave', {});
        return 0;
    }
}
