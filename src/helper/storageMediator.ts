import {IStorageBaseObject} from '../common/interfaces/storage';


class StorageMediator{
  static readonly messageKeyPrefix: string = 'customer';

  static saveToStorage(userId:string, data:IStorageBaseObject) {
    localStorage.setItem(`${StorageMediator.messageKeyPrefix}:${userId}`, JSON.stringify(data));
  }

  static saveToStorageByName(userId:string, data:any, name:string) {
    localStorage.setItem(`${StorageMediator.messageKeyPrefix}:${userId}:${name}`, JSON.stringify(data));
  }

  static getFromStorageByName(userId:string, name:string, subname?:string) {
    const temp=localStorage.getItem(`${StorageMediator.messageKeyPrefix}:${userId}:${name}`);
    if(temp){
      const parsedData = JSON.parse(temp);
      if(subname){
        return parsedData[subname];
      }
      return parsedData
    }
    return null;
  }

  static updateFromStorage(userId:string):IStorageBaseObject | null {
    const temp=localStorage.getItem(`${StorageMediator.messageKeyPrefix}:${userId}`);
    if(temp){
       return JSON.parse(temp);
     }
    return null;
  }
}

export default StorageMediator;







// define([
//   'events/casualEvents'
// ], function(casualEvents) {
//
//   var Storage = function() {
//     this.uid = this.generateUID();
//     this.messageKeyPrefix = 'adapter:';
//
//   };
//
//   Storage.prototype.generateUID = function() {
//     return [Date.now(), Math.random()].join('::');
//   };
//
//   Storage.prototype.set = function(key,value) {
//     var temp=localStorage.getItem(this.messageKeyPrefix+key);
//     var data= [];
//     if(temp){
//       data = JSON.parse(temp);
//     }
//     data.push(value);
//     localStorage.setItem(this.messageKeyPrefix+key, JSON.stringify(data));
//   };
//
//   Storage.prototype.check = function(key, value) {
//     if(key && value){
//       var data=[];
//       data = JSON.parse(localStorage.getItem(this.messageKeyPrefix+key));
//       if(data && data.indexOf(value)>-1){
//         return  true;
//       }
//     }
//     return false;
//   };
//
//   Storage.prototype.delete = function(key) {
//     if(key){
//       localStorage.removeItem(this.messageKeyPrefix+key);
//     }
//   };
//
//   Storage.prototype.setObject = function(key,value) {
//     var temp=localStorage.getItem(this.messageKeyPrefix+key);
//     var data= {};
//     if(temp){
//       data = JSON.parse(temp);
//     }
//     if(!data.hasOwnProperty(value.recordId)){
//       data[value.recordId]=value;
//       casualEvents.trigger('RECORD_ADDED', value);
//     }
//     localStorage.setItem(this.messageKeyPrefix+key, JSON.stringify(data));
//   };
//
//
//   Storage.prototype.getReccords = function(key) {
//     var temp=localStorage.getItem(this.messageKeyPrefix+key);
//     var data= {};
//     if(temp){
//       data = JSON.parse(temp);
//     }
//     return data;
//   };
//
//   return new Storage();
// });
