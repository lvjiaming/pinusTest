
class UIKiller {
    bindThor(node: cc.Node, js?: any): any;
}

class Preload {
    m_HeadDef: cc.SpriteFrame;
    m_Prefab: { [key: string]: cc.Prefab };
    m_UserHeadMap: { [key: number]: cc.SpriteFrame };
    m_Sounds: { [key: string]: cc.AudioClip } = {};
    loadPrefab(progressCallback: (completedCount: number, totalCount: number, item: any) => void): Promise<null>;
    loadPicture(): Promise<null>;
    loadSounds(progressCallback: (completedCount: number, totalCount: number, item: any) => void): Promise<null>;
}

class Pinus {
    public connected: boolean;
    public async init(ipConfig: IPConfig): Promise<null>;
    public async request(route: string, data: Object): Promise<any>;
    public disconnect();
    public on(eventName: string, callback: Function, target?: any);
    public onEvents(eventName: string[], target: any);
    public notify(route: string, data: Object);
    public off(eventName?: string, callback?: Function, target?: any);
    public offEvents(eventName: string[], target?: any);
    public once(eventName: string, callback: Function, target?: any);
}

class AudioEngine {
    playMusic(name: string);
    playEffect(name: string);
    setMusicVolume(value: number);
    setEffectVolume(value: number);
}

class Http {
    async get(url: string, params?: object): Promise<any> ;
    async post(url: string, params?: object): Promise<any>;
}

declare module vv {
    export var uikiller: UIKiller;
    export var preload: Preload;
    export var pinus: Pinus;
    export var md5: (str: string) => string;
    export var userInfo: IUserInfo;
    export var roomInfo: IRoomBaseInfo;
    export var gameClient: GameClient;
    export var club: { clubInfo: IClubBaseInfo, userInfo: IClubUserInfo, infoJS: any };
    export var audio: AudioEngine;
    export var replay: IRecordData;
    export var gps: IGPSInfo;
    export var http: Http;
}

class GameClient {
    meChairID: number;
    sitUser: ITableUser[];
    sendGame(route: string, data: any): void;
    sendFrame(route: string, data: any): void;
    gameView: any;
    showPrefab<T>(name: string, parent?: cc.Node): Promise<T>;
    getMaxPlayer(): number;
    getGender(chairID: number): string;
    view2Chair(chairID: number): number;
    chair2View(chairID: number): number;
}


declare static var LOG_NET: boolean;
declare var SCENE_HEIGHT: number;
declare var SCENE_WIGHT: number;
declare var SERVER_IP: string;
declare var SERVER_PORT: string;
declare var HTTP_PORT: string;
declare var GAME_NAME: string;
declare var g_CurScence: any;
declare var g_IPConfig: IPConfig;
declare var g_isHide: boolean;
declare var SHARE_URL: string;
declare function dclone<T>(obj: T): T;
declare interface AlertType {
    Yes: number;
    YesNo: number;
    All: number;
}
declare var Alert: AlertType;
declare interface IPConfig {
    host: string,
    port: string,
    log: boolean
}

declare interface IUserInfo {
    readonly UserID: number;
    readonly GameID: number;
    readonly AgentID: number;
    readonly Gender: number;
    readonly MemberOrder: number;
    readonly SpreaderID: number;
    readonly Score: number,
    readonly InsureScore: number,
    readonly RoomCard: number,
    NickName: string;
    readonly Accounts: string;
    readonly FaceURL: string;
    readonly LogonPass: string;
    readonly SessionSecret: string;
}

declare interface IResponse {
    status: number,
    msg: string,
    data: any
}

declare interface ICreateRoom {
    UserID: number;
    ClubKey: number;
    KindID: number;
    ServerRules: number;
    GameRules: number[];
}

declare interface IRoomBaseInfo {
    RoomID: number;
    KindID: number;
    GPSInfo?: IGPSInfo;
}

declare interface IRoomInfo {
    ID: number;
    RoomID: number;
    KindID: number;
    ServerID: number;
    ServerRules: number;
    GameRules: number[];
    Process: number;
    ClubKey: number;
    CreatorID: number;
    CreteTime: string;
    StarTime: string;
}

declare interface ITableUser {
    readonly UserInfo: IUserInfo;
    ChairID: number;
    State: number;
    Ready: boolean;
    Offline: boolean;
    Score: number;
    sid: string;
    GPSInfo?: IGPSInfo;
}

declare interface ILookonUser {
    readonly UserInfo: IUserInfo;
    ChairID: number;
    sid: string;
}

declare interface IGameMsg {
    route: string,
    data: any
}


declare interface IClubBaseInfo {
    ClubKey: number;
    ClubID: number;
    ClubName: string;
    MemberCount: number;
    TableCnt: number;
    MaxUserCnt: number;
}

declare interface IClubUserInfo {
    UserID: number;
    MemberOrder: number;
    Score: number;
}

declare interface IChatInfo {
    chairID: number;
    sign: number;
    msg: string;
    toChair?: number;
}

declare interface IRecordData {
    roomInfo: IRoomInfo;
    sitUser: ITableUser[];
    gameData: { chair: number, route: string, info: any }[];
    isReturn: boolean;
}

declare interface IGPSInfo {
    berror: boolean;
    code: number;
    msg: string;
    latitude: number;
    longitude: number;
    address: string;
    sortadd: string;
}
