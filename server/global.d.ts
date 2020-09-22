declare interface IRoomBaseInfo {
    RoomID: number;
    KindID: number;
    GPSInfo?: IGPSInfo;
}

declare interface ITable {
    sitUser: ITableUser[];
    roomInfo: IRoomInfo;
    setRoomInfo(RoomID: number): Promise<void>;
    enterRoom(userID: number, session: any, gps?: IGPSInfo): Promise<boolean>;
    sendMsgByUserID(userID: number, route: string, res: any): boolean;
    sendMsgByChair(chair: number, route: string, res: any, sendLookon?: boolean): boolean;
    sendMsgToAll(route: string, res: any): boolean;
    gameState: number;
    startGame(): void;
    concludeGame(isDiss?: boolean): void;
    writeScore(score: number[], revenue?: number[]): void;

    setTimer(key: string, interval: number, params?: any): void;
    clearTimer(key: string): void;
    stopTimer(key: string): void;
    resumeTimer(key: string): void;
    getTimer(key: string): number;
}

declare interface ITableSink {
    setRules(gameRules: number[], serverRules: number): void;
    getUserCnt(): number;
    getMaxChair(): number;
    onEnterUser(chair: number, user: ITableUser): void;
    onCheckEnter(userID: number): Promise<boolean>;
    onLeaveUser(chair: number): void;
    onScene(chairID: number): boolean;
    onFrameStart(): boolean;
    sendBigEnd(): void;
    getMaxInning(): number;
    concludeGame(chair: number, isDiss?: boolean): void;
    onEventTimer(key: string, param: any): boolean;
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


declare interface IUserInfo {
    UserID: number;
    GameID: number;
    AgentID: number;
    Gender: number;
    MemberOrder: number;
    SpreaderID: number;
    Score: number,
    InsureScore: number,
    RoomCard: number,
    NickName: string;
    Accounts: string;
    FaceURL: string;
    LogonPass: string;
    SessionSecret: string;
}


declare interface ITableUser {
    UserInfo: IUserInfo;
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

declare interface ICreateRoom {
    UserID: number;
    ClubKey: number;
    KindID: number;
    ServerRules: number;
    GameRules: number[];
}

declare interface IGPSInfo {
    berror: boolean;
    code: number;
    msg: string;
    latitude: number;
    longitude: number;
    address: string;
}