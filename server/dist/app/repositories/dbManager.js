"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBManager = void 0;
const accountDB_1 = require("./accountDB");
const clubDB_1 = require("./clubDB");
const gameDB_1 = require("./gameDB");
const recordDB_1 = require("./recordDB");
const shopDB_1 = require("./shopDB");
const systemDB_1 = require("./systemDB");
class DBManager {
    constructor() { }
    static get() {
        if (this._instance == null) {
            this._instance = new DBManager();
        }
        return this._instance;
    }
    get accountDB() {
        if (DBManager._accountDB == null) {
            DBManager._accountDB = new accountDB_1.AccountDB();
        }
        return DBManager._accountDB;
    }
    get shopDB() {
        if (DBManager._shopDB == null) {
            DBManager._shopDB = new shopDB_1.ShopDB();
        }
        return DBManager._shopDB;
    }
    get systemDB() {
        if (DBManager._systemDB == null) {
            DBManager._systemDB = new systemDB_1.SystemDB();
        }
        return DBManager._systemDB;
    }
    get recordDB() {
        if (DBManager._recordDB == null) {
            DBManager._recordDB = new recordDB_1.RecordDB();
        }
        return DBManager._recordDB;
    }
    get gameDB() {
        if (DBManager._gameDB == null) {
            DBManager._gameDB = new gameDB_1.GameDB();
        }
        return DBManager._gameDB;
    }
    get clubDB() {
        if (DBManager._clubDB == null) {
            DBManager._clubDB = new clubDB_1.ClubDB();
        }
        return DBManager._clubDB;
    }
}
exports.DBManager = DBManager;
DBManager._instance = null;
DBManager._accountDB = null;
DBManager._shopDB = null;
DBManager._systemDB = null;
DBManager._recordDB = null;
DBManager._gameDB = null;
DBManager._clubDB = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYXBwL3JlcG9zaXRvcmllcy9kYk1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQXdDO0FBQ3hDLHFDQUFrQztBQUNsQyxxQ0FBa0M7QUFDbEMseUNBQXNDO0FBQ3RDLHFDQUFrQztBQUNsQyx5Q0FBc0M7QUFFdEMsTUFBYSxTQUFTO0lBZ0JsQixnQkFBd0IsQ0FBQztJQUVsQixNQUFNLENBQUMsR0FBRztRQUNiLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFBO1NBQ25DO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFJLFNBQVM7UUFDVCxJQUFJLFNBQVMsQ0FBQyxVQUFVLElBQUksSUFBSSxFQUFFO1lBQzlCLFNBQVMsQ0FBQyxVQUFVLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7U0FDMUM7UUFDRCxPQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFDaEMsQ0FBQztJQUVELElBQUksTUFBTTtRQUNOLElBQUksU0FBUyxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUU7WUFDM0IsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO0lBQzdCLENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDUixJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQzdCLFNBQVMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxtQkFBUSxFQUFFLENBQUM7U0FDeEM7UUFDRCxPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUVELElBQUksUUFBUTtRQUNSLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDN0IsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztTQUN4QztRQUNELE9BQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ04sSUFBSSxTQUFTLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUMzQixTQUFTLENBQUMsT0FBTyxHQUFHLElBQUksZUFBTSxFQUFFLENBQUM7U0FDcEM7UUFDRCxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUM7SUFDN0IsQ0FBQztJQUVELElBQUksTUFBTTtRQUNOLElBQUksU0FBUyxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUU7WUFDM0IsU0FBUyxDQUFDLE9BQU8sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1NBQ3BDO1FBQ0QsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDO0lBQzdCLENBQUM7O0FBakVMLDhCQWtFQztBQWhFa0IsbUJBQVMsR0FBYyxJQUFJLENBQUM7QUFFNUIsb0JBQVUsR0FBYyxJQUFJLENBQUM7QUFFN0IsaUJBQU8sR0FBVyxJQUFJLENBQUM7QUFFdkIsbUJBQVMsR0FBYSxJQUFJLENBQUM7QUFFM0IsbUJBQVMsR0FBYSxJQUFJLENBQUM7QUFFM0IsaUJBQU8sR0FBVyxJQUFJLENBQUM7QUFFdkIsaUJBQU8sR0FBVyxJQUFJLENBQUMifQ==