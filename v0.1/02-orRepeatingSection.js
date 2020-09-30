class orRepeatingSection{
    static create (charObj){
        return new Proxy({char:charObj},orRepeatingSection.repeatingSectionHandler);
    }
    
    static generateRowId() { //this method blatantly pulled form the roll20 forums.
        "use strict";
        var a = 0, b = [];
        var c = (new Date()).getTime() + 0, d = c === a;
        a = c;
        for (var e = new Array(8), f = 7; 0 <= f; f--) {
            e[f] = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(c % 64);
            c = Math.floor(c / 64);
        }
        c = e.join("");
        if (d) {
            for (f = 11; 0 <= f && 63 === b[f]; f--) {
                b[f] = 0;
            }
            b[f]++;
        } else {
            for (f = 0; 12 > f; f++) {
                b[f] = Math.floor(64 * Math.random());
            }
        }
        for (f = 0; 12 > f; f++){
            c += "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".charAt(b[f]);
        }
        return c.replace(/_/g, "Z");
    };
   
    static repeatingSectionHandler={ 
        get:(obj,prop)=>{  //char.repeating.<prop> ->
            var prefixes=[];
            var retval=[];
            
            //identify all the repeating elements of the specified type for this character, by identifying the prefix Roll20 uses
            findObjs({characterid: obj.char.id, type: 'attribute'}).forEach(i=>{
                var m=i.get("name").match(new RegExp(`repeating_${prop}_[^_]*_`));
                if(m!=null) prefixes.push(m[0]);
            });
            
           prefixes=[... new Set(prefixes)]; //make unique list of prefixes, since these will exist for each parameter
           
            //now construct our array of repeating objects of the specified type, by creating the Proxy with the repeatingObjHandler and passing in the prefix
            prefixes.forEach(prefix=>{
                var charId=obj.char.id;
                var rowPrefix=prefix;
                retval.push(new Proxy({charId:obj.char.id,prefix:prefix, 
                    delRow:()=>{
                        findObjs({ _characterid: charId, _type: 'attribute'}).forEach(i=>{
                                if(i.get("name").indexOf(rowPrefix)>-1){
                                log("removing:"+i.get("name"));
                                i.remove(); 
                            }
                        });
                    },
                },this.repeatingRowHandler))
            });
            
            //these are created locally so they will be promoted into the attached addRow method
            var charId=obj.char.id;
            var section=prop;
            retval.addRow= function (attribs){
                var char=orCharacter.fromId(charId);
                var newRowId = orRepeatingSection.generateRowId();
                for (var prop in attribs){
                    var name=`repeating_${section}_${newRowId}_${prop}`;
                    var obj=createObj("attribute", {
                        characterid: charId,
                        name: name,
                        current: ""
                    });
                    obj.setWithWorker({current:attribs[prop]});
                }
                
                char.forceRecalc=Date.now(); //TODO: this is a workersheet item that does not below in the base class
                return newRowId; //perhaps search the character for this new item and return it?
            };
            return retval;
        }, 
        set:(obj, prop, value)=>{
            return true;
        }
    };
    static repeatingRowHandler={
        //expand the simple property passed in with the prefix and character id, and return the current value
        get:(obj,prop)=>{
            if(prop=="delRow") return obj.delRow;
            if(prop=="prefix") return obj.prefix;
            if(prop=="charId") return obj.charId;
            var retval=null;
            findObjs({ _characterid: obj.charId, _type: 'attribute', _name: obj.prefix+prop}).forEach(i=>{
                retval=i.get("current");
            });
            //if(retval==null) log(`Warning: Unable to find property "${prop}" Returning NULL. `);
            return retval;
        },
        set:(obj, prop, value)=>{
            findObjs({ _characterid: obj.charId, _type: 'attribute', _name: obj.prefix+prop}).forEach(i=>{
                i.setWithWorker({current:value});
            });
            return true;
        }
    };
}