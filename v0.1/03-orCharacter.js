class orCharacter{
    id=null;
    repeating=null;
    constructor(characterId, suppressWarning=false){
        this.id=characterId;
        if(suppressWarning==false) log("WARNING! It is best practice to create orCharacter objects using the factory pattern, to allow for game specific versions of characters.  As such, consider using: orCharacter.fromId(charId); rather than: new orCharacter(charId);");
    }
    
    static fromId(characterId){
        var retval=new orCharacter(characterId,true);
        return retval.wrap(); 
    }
    static fromToken(token){
        var tokenId=token;
        if(typeof token=="object") tokenId=token.id;
        var tokenObj=getObj("graphic", tokenId);
        if(tokenObj==null) return null;
        var retval=new orCharacter(tokenObj.get("represents"),true);
        return retval.wrap(); 
    }
    wrap(){
        return new Proxy(this, orCharacter.attrHandler);    
    }
    toJSON(){
        return `${this.id}: [Not implemented: query and return all character attributes]`;
    }
    findToken(){
        var tokens = findObjs({                              
            _pageid: Campaign().get("playerpageid"),                              
            _type: "graphic",
            represents:this.id                          
          });
        
        return tokens[0];
    }
    distanceFromToken(targetToken){ 
        if(typeof targetToken=="string"){  //if tokenId was passed in, insted of a token, resolve this
            targetToken = findObjs({                              
                _type: "graphic",
                id:targetToken 
              })[0];
        }
        //TODO:this isn't right, see Atlas's cell....
        var token=this.findToken();
        var left = token.get("left") - targetToken.get("left"); 
        var top = token.get("top") - targetToken.get("top");
        var dist = Math.sqrt((left*left)+(top*top));
        
        var units=getObj("page",Campaign().get("playerpageid")).get("scale_number");
        
        dist = Math.floor((dist/70)*Number(units)); 
        
        return dist;
    }
    static attrHandler = {
            get: (obj, prop)=>{
                switch(prop){
                    case "repeating":
                        if(obj.repeating==null) {
                            obj.repeating=orRepeatingSection.create(obj); 
                        }
                        return obj.repeating;
                        break;
                }
                try{
                    return (obj[prop])||getAttrByName(obj.id, prop);
                }catch{
                    return "";
                }
            },
            set: (obj, prop, value)=>{
                if(prop=="repeating") {
                    log("ERROR: the repeating property is reserved on the character object and cannot be created.");
                    return;
                }
                var json=`{"type":"attribute", "characterid":"${obj.id}", "name":"${prop}"}`;
                var attrib=findObjs(JSON.parse(json))[0];
                if(attrib==null){
                    var obj=createObj("attribute", {
                        name: prop,
                        current: "",
                        characterid: obj.id
                    });
                    obj.setWithWorker({current:value});
                }
                else {
                    if(getAttrByName(obj.id, prop)==value) attrib.setWithWorker({current:""});
                    attrib.setWithWorker({current:value});
                }
                return true;
            }
        };
    
}
