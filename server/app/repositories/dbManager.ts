import { AccountDB } from "./accountDB";
import { ClubDB } from './clubDB';
import { GameDB } from './gameDB';
import { RecordDB } from "./recordDB";
import { ShopDB } from "./shopDB";
import { SystemDB } from "./systemDB";

export class DBManager {

    private static _instance: DBManager = null;

    private static _accountDB: AccountDB = null;

    private static _shopDB: ShopDB = null;

    private static _systemDB: SystemDB = null;

    private static _recordDB: RecordDB = null;

    private static _gameDB: GameDB = null;

    private static _clubDB: ClubDB = null;

    private constructor() { }

    public static get() {
        if (this._instance == null) {
            this._instance = new DBManager()
        }
        return this._instance;
    }

    get accountDB(): AccountDB {
        if (DBManager._accountDB == null) {
            DBManager._accountDB = new AccountDB();
        }
        return DBManager._accountDB;
    }

    get shopDB(): ShopDB {
        if (DBManager._shopDB == null) {
            DBManager._shopDB = new ShopDB();
        }
        return DBManager._shopDB;
    }

    get systemDB(): SystemDB {
        if (DBManager._systemDB == null) {
            DBManager._systemDB = new SystemDB();
        }
        return DBManager._systemDB;
    }

    get recordDB(): RecordDB {
        if (DBManager._recordDB == null) {
            DBManager._recordDB = new RecordDB();
        }
        return DBManager._recordDB;
    }

    get gameDB(): GameDB {
        if (DBManager._gameDB == null) {
            DBManager._gameDB = new GameDB();
        }
        return DBManager._gameDB;
    }

    get clubDB(): ClubDB {
        if (DBManager._clubDB == null) {
            DBManager._clubDB = new ClubDB();
        }
        return DBManager._clubDB;
    }
}