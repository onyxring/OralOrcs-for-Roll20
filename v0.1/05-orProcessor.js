//orProcessor implements a base class for processing !api commands 
class orProcessor{
    static __instances=[]; //we allow for several processors to be created
    static __isConfigured=false; //for things that are initiated only once, regardless of how may processes are created
    
    static who=null;
    __key="";

    constructor(key){
        orProcessor.__configure();
        orProcessor.__instances=orProcessor.__instances.filter(p => p.__key != key); //ensure the instances array does not alreay have a handler for this already installed
        this.__key=key;
        orProcessor.__instances.push(this);
    }
    
    static __configure(){
        if(orProcessor.__isConfigured==true) return;
            on("chat:message", orProcessor.__processAll);
            on("change:attribute", orProcessor.__processAllAttrChanges);
        orProcessor.__isConfigured=true;
    }

    static __processAll(msg){
        orProcessor.__instances.forEach((inst)=>{ inst.__process(msg); });
    }
    
    __process(msg){
        var ptr=msg.content.indexOf(this.__key);
        if(ptr==-1) return;
        if(ptr>1) return;
        var obj=null;
        var tokens=msg.content.substr(ptr+this.__key.length).trim().split(" ");
        var type=tokens.splice(0,1);
        var json=tokens.join(" ");
        try{
            json=this.decode(json);
            json=json.replace(/\/:/ig,":");
            obj=JSON.parse(json);
            obj.isObj=true;
        }catch{ //unable to decode json, so let's just send the whole thing as a string
            obj=new String(json);  //we use string object so that we can assign the isObj property
            obj.isObj=false;
        }

        if(this[type]==null){
            orSend.actor(`Error: No handler for API message.`, "System");
            orSend.gm(`Error: No handler for API message: ${type}`, "System");
            log("No handler for API message: "+type);
            return;
        }
        orProcessor.who=msg.who;

        var playerOrPc=null;
        
        if(obj!=null && obj.charId!=null) //if characterId is explicitly passed in, then use that
            playerOrPc=orCharacter.fromId(obj.charId);
        else{  //otherwise, let's try to find the character by name 
            var pcobj=findObjs({ _name: msg.who, _type: 'character'});
            if(pcobj.length>0) playerOrPc=orCharacter.fromId(pcobj[0]._id);
        }
        //if we still haven't located a character, assume that we are simply acting as the player (e.g, the GM)
        if(playerOrPc==null) {
            playerOrPc=orProcessor.getPlayer(msg.playerid);
        }
        this[type](obj, playerOrPc, msg);
    }
    decode(json){
        var retval=json.replace(/“/g,"\"").replace(/”/g,"\"").replace(/’/g,"'").replace(/…/g,":").replace(/Ú/g,':').replace(/æ/g,'"').replace(/Æ/g,'"'); 
        retval=decodeURI(retval);
        return retval;
    }
    encode(obj){
        return JSON.stringify(obj).replace(/:/g,"…").replace(/"/g,'æ'); 
    }

    static __getTargets(msg){
        var retval=[];
        if(msg.selected!=null) {
            msg.selected.forEach(target=>{
                var token=getObj("graphic", target._id);
                try{
                    retval.push(orCharacter.fromToken(token));
                }catch{ }
            });
        }
        return retval;
    }
    
    static __processAllAttrChanges(obj){
        orProcessor.__instances.forEach((inst)=>{inst.__processAttrChanges(obj);});
    }
    
    __processAttrChanges(obj){
        var key="onChanged_"+obj.get("name");
        if(this[key]==null) return;
        var charid=obj.get("_characterid");
        var char=orCharacter.fromId(charid);
        this[key](char, obj);
    }

    static getPlayer(playerId){
        var handler = {
            get: (obj, prop)=>{
                if(prop=="id") return obj.id; 
                var player=getObj("player", obj.id);
                if(prop=="toJson") return JSON.stringify(player);
                return player.get(prop);
            },
            set: (obj, prop, value)=>{
                var player=getObj("player", obj.id);
                player.set(prop, value);
                return true;
            }
        };
        return new Proxy({"id":playerId}, handler);
    }
}

//handler=null;
//function apiGet(obj, func){
//    handler=func; 
//    setAttrs({"Ω":""}); //clear response
//    setAttrs({"å":""}); //clear request
//    setAttrs({"å":obj});//send request
//}
//on("change:Ω", function(a){
//    if(handler==null || typeof handler!="function") return;
//    getAttrs(["Ω"],function(values){
//        handler(values.Ω);
//    });
//});
//
//on("sheet:opened",i=>{
//    apiGet("request",(resp)=>{
//        setAttrs({"spdDisplay":resp});
//    });
//    //setAttrs({"Ω":0});
//});



//static getCharacterFromTokenId(tokenId){
//}



