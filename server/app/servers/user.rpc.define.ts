// 这种
// UserRpc的命名空间自动合并
import { BackendSession, FrontendSession, RemoterClass } from 'pinus';
import { ClubRemote } from './club/remote/clubRemote';
import { GameRemote } from './game/remote/gameRemote';
import { HallRemote } from "./hall/remote/hallRemote";
import { BankRemote } from "./hall/unuse/bankRemote";
import { NoticeRemote } from "./hall/unuse/noticeRemote";
import { RechargeRemote } from "./hall/unuse/rechargeRemote";


declare global {
    interface UserRpc {
        hall: {
            hallRemote: RemoterClass<FrontendSession | BackendSession, HallRemote>
            rechargeRemote: RemoterClass<BackendSession, RechargeRemote>
            noticeRemote: RemoterClass<BackendSession, NoticeRemote>
            bankRemote: RemoterClass<BackendSession, BankRemote>
        };
        game: {
            gameRemote: RemoterClass<BackendSession | FrontendSession, GameRemote>
        }
        club: {
            clubRemote: RemoterClass<BackendSession | FrontendSession, ClubRemote>
        }
    }
}