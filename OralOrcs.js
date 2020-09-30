//---------------------------------------
//-- 00-orFrameworkProperties.js
orFrameworkProperties={
    version:.1    
}

//---------------------------------------
//-- 01-orTemplates.js
class orTemplates{
    static includeOnClient=false;
    static templates={}
    static add(templ){
        orTemplates.templates={...orTemplates.templates, ...templ};
    }
    
    static get(){ return new Proxy(new orTemplates(), orTemplates.proxyHandler);  }
    
    //encode api commands
    static cmd(p){
        p=p.replace(/\:/ig,"/:").replace(/\"/ig,"%22"); 
        return p;
    }
    static proxyHandler = {
        get: (obj, prop)=>{
            
            var retval=orTemplates.templates[prop]; //seed with the passed in template
            if(retval==null) { //if no template found, then try to return any static members of orTemplate
                if(orTemplates[prop]!=null) 
                    return orTemplates[prop];
                else
                    log(`ERROR: Template ${prop} is not defined.`);
                return;
            }

            //return this function to be called inline with the Proxy return, making the whole resolution process syntactically beautiful
            return (params)=>{
                if(params==null) params={__empty:""};
                
                //we call this multiple times to ensure recusion works right
                var resolvePassedInTemplates=(text)=>{
                    //fill any placeholders that values have been specified for 
                    for(var param in params){
                        var p=params[param];
                        if(p==null)p=""; 
                        var rx=new RegExp(`{${param}}`,'ig'); //find each occurance of the parameter
                        text=text.replace(rx,p);  //and replace it
                        text=text.replace(/\r|\n/ig,""); //then get rid of all the newlines, to make it compatible with R20
                    }
                    return text;
                };

                var resolveDefinedTemplates=(text)=>{
                    for(var template in orTemplates.templates){ //for each template defined
                        text=text.replace(new RegExp(`{${template}}`,'ig'),orTemplates.templates[template]); //fill in a placeholder
                        text=resolvePassedInTemplates(text); //then cycle through all the parameters, to fill those in before moving to the next template
                    }
                    return text;
                };
                
                retval=resolveDefinedTemplates(retval);

                var count=1;
                while(count++){
                    var newVal=resolveDefinedTemplates(retval);
                    if(newVal==retval) break;
                    if(count>=10) {
                        log("Error: template resolution exceed max number of nested calls.");
                        break;
                    }
                    retval=newVal;
                }
                return retval;
            }
        }
    }
}

orTemplates=orTemplates.get();

//---------------------------------------
//-- 02-orDice.js
class orDice{
    static translateDieNormal(sides, roll, tags){
        if(typeof sides=="object"){
            tags=sides.tags;
            roll=sides.roll;
            sides=sides.sides;
        }
        var retval=Number(roll); 
        if(tags.includes("half")) retval=Math.round(retval/2);
        return retval;
    }
    static total(translateMethod=orDice.translateDieNormal){
        var retval=0;
        for(var d of this.dice) { 
            retval+=translateMethod(d.sides, d.roll, d.tags);
        }
        retval+=Number(this.adjustment);
        return retval;
    }
    static roll(expression){
        var retval={dice:[],adjustment:0, expression:expression, displayExpression:expression.replace(/\.5/,"&frac12;"), total:orDice.total};
        
        for(var match of expression.matchAll(/(?:([0-9]+)?(.5)?)d([0-9]+)([+-][0-9]+)?/ig)){
            if(match[4]!=null) retval.adjustment=Number(match[4]);
            var sides=match[3];
            for(var i=0;i<Number(match[1]);i++){
                retval.dice.push({sides: sides, roll:randomInteger(sides), tags:[]});
            }
            if(match[2]!=null) retval.dice.push({sides: sides, roll:randomInteger(sides), tags:["half"]});
        }
        retval.diceLineHtml=(translationMethod=orDice.translateDieNormal, subLabel="")=>{return orDice.getDiceLine(retval, translationMethod, subLabel);};
        return retval;
    }
    static getDiceLine(roll, translationMethod=orDice.translateDieNormal, subLabel=""){
        var line="";
        roll.dice.forEach(value=>{
            var trueValue = translationMethod(value);
            if(value.tags.includes("half")) {
                if(subLabel=="") 
                    subLabel="Half";
                else
                    subLabel+=" (Half)";
            }
            
            line+=orTemplates.singleDie({faceValue:value.roll,
                subLabel:(subLabel=="")?"": orTemplates.dieSubLabel({subLabel:subLabel, trueValue:trueValue})
            });
        });
        
        return orTemplates.diceLine({diceLine:line});
    }
}

//register the die template for generation
orTemplates.add({diceLine:`<div style="clear:both;height:25px;">
                    {diceLine}
                </div>`});
orTemplates.add({singleDie:`<div style="float:left;width:35px;">
                    <div style="text-align:center; margin:2px; border:black solid 1px;">
                            <div>{faceValue}</div>
                    </div>
                    {subLabel}
                </div>`});
orTemplates.add({dieSubLabel:`<div style='text-align:center;margin-top:-5px;font-size:8px;'>{subLabel}:{trueValue}</div>`});




//---------------------------------------
//-- 02-orRepeatingSection.js
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

//---------------------------------------
//-- 02-orSend.js
class orSend{
    static _all(html, sendAs=null){
        var sendAs=sendAs||orProcessor.who||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs, (sendAs==null?"/desc ":"/direct ")+html);
    }
    static _gm(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs, `/w gm `+html);
    }
    static _actor(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs,`/w ${orProcessor.who} `+html);
    }
    static _gmCopy(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        this._gm(html, sendAs+`, to: ${orProcessor.who}`); 
    }
    static all=orSend._wrap(orSend._all);
    static gm=orSend._wrap(orSend._gm);
    static actor=orSend._wrap(orSend._actor);
    static gmCopy=orSend._wrap(orSend._gmCopy);
    static templates=null;
    static registerTemplates(templates){ orSend.templates=templates; }

    static _wrap(f){
        return new Proxy(f, {
                get: (obj, prop)=>{
                    var output = orTemplates.get();
                    return (parameters, sendAs=null)=>{
                        obj(output[prop](parameters, sendAs));
                    }
                }
            }
        );
    }
}

//---------------------------------------
//-- 03-orCharacter.js
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


//---------------------------------------
//-- 05-orProcessor.js
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





//---------------------------------------
//-- 10-orClientScript.js
class orClientScript{
    static scripts;
    static finalScripts;
    constructor(){
        if(!this.initialize()) return;
        on("ready",()=>{
            findObjs({_type: "character"}).forEach(c=> {    
                orCharacter.fromId(c.get("_id")).Ω=this.render();
                }); 
        });
    }
    render(){ 
        var retval=orClientScript.orcs;
        orClientScript.scripts.forEach(script=>{
            if(script!=null) retval+=("\n"+script);
        });
        orClientScript.finalScripts.forEach(script=>{
            if(script!=null) retval+=("\n"+script);
        });
        return retval; 
    }
    initialize(){
        if(orClientScript.scripts!=null) {
            log("Warning: trying to instantiate orClientScript. Typically you won't need to do this at all.  Try adding client code with 'orClientScript.scripts.push(code);'");
            return false; 
        }
        orClientScript.scripts=[];
        orClientScript.finalScripts=[];
        //orClientScript.scripts.push(`function log(txt){console.log(txt);}`); //log seems likes it's supported in the core workersheet.  So... not sure what's changed.
        orClientScript.scripts.push(`
            class orClientScriptLibrary{ 
                version=${orFrameworkProperties.version};
                constructor(){ log("ORCS (version " + this.version + ") enabled."); }
                
                resolveCallbacks(event){ 
                    on=µ; //restore "on" to its original version
                    ç.forEach((cb)=>{
                        if(cb[0]=='sheet:opened') 
                            cb[1]();  //run the sheet:opened handlers directly, since that has already fired
                        else
                            on(cb[0],cb[1]); //register the rest
                    }); 
                }
                sendData(type, paramsObj){
                    var p={"ts":Date.now(), "type":type, "paramsObj":paramsObj};
                    pc.å=JSON.stringify(p).replaceAll(/"/gi,'\\\\"');
                }
            }`
        );        
        orClientScript.finalScripts.push(`orcs=new orClientScriptLibrary(); orcs.resolveCallbacks();`); 
        return true;
    }
}
//we've defined this script object, now let's actually create it
new orClientScript(); //we dont have to keep an instance of it, since it registers 


//---------------------------------------
//-- 21-orcsAsync.js
orClientScript.scripts.push(`
    function setActiveCharacterId(charId){
        var oldAcid=getActiveCharacterId();
        var ev = new CustomEvent("message");
        ev.data={"id":"0", "type":"setActiveCharacter", "data":charId};
        self.dispatchEvent(ev); 
        return oldAcid;
    }
    var _sIn=setInterval;
    setInterval=function(callback, timeout){
        var acid=getActiveCharacterId();
        _sIn(
            function(){
                var prevAcid=setActiveCharacterId(acid);
                callback();
                setActiveCharacterId(prevAcid);
            }
        ,timeout);
    }
    var _sto=setTimeout
    setTimeout=function(callback, timeout){
        var acid=getActiveCharacterId();
        _sto(
            function(){
                var prevAcid=setActiveCharacterId(acid);
                callback();
                setActiveCharacterId(prevAcid);
            }
        ,timeout);
    }
    function getAttrsAsync(props){
        var acid=getActiveCharacterId(); //save the current activeCharacterID in case it has changed when the promise runs 
        var prevAcid=null;               //local variable defined here, because it needs to be shared across the promise callbacks defined below
        return new Promise((resolve,reject)=>{
                prevAcid=setActiveCharacterId(acid);  //in case the activeCharacterId has changed, restore it to what we were expecting and save the current value to restore later
                try{
                    getAttrs(props,(values)=>{  resolve(values); }); 
                }
                catch{ reject(); }
        }).finally(()=>{
            setActiveCharacterId(prevAcid); //restore activeCharcterId to what it was when the promise first ran
        });
    }
    //use the same pattern for each of the following
    function setAttrsAsync(propObj, options){
        var acid=getActiveCharacterId(); 
        var prevAcid=null;               
        return new Promise((resolve,reject)=>{
                prevAcid=setActiveCharacterId(acid);  
                try{
                    setAttrs(propObj,options,(values)=>{ resolve(values); });
                }
                catch{ reject(); }
        }).finally(()=>{
            setActiveCharacterId(prevAcid); 
        });
    }

    function getSectionIDsAsync(sectionName){
        var acid=getActiveCharacterId(); 
        var prevAcid=null;               
        return new Promise((resolve,reject)=>{
                prevAcid=setActiveCharacterId(acid);  
                try{
                    getSectionIDs(sectionName,(values)=>{ resolve(values); });
                }
                catch{ reject(); }
        }).finally(()=>{
            setActiveCharacterId(prevAcid); 
        });
    }
    function getSingleAttrAsync(prop){ 
        var acid=getActiveCharacterId(); 
        var prevAcid=null;               
        return new Promise((resolve,reject)=>{
                prevAcid=setActiveCharacterId(acid);  
                try{
                    getAttrs([prop],(values)=>{  resolve(values[prop]); }); 
                }
                catch{ reject(); }
        }).finally(()=>{
            setActiveCharacterId(prevAcid); 
        });
    }
`);


//---------------------------------------
//-- 21-orcsRepeatingSection.js
orClientScript.scripts.push(
class orcsRepeatingSection{
    static create (charObj){
        return new Proxy({char:charObj},orcsRepeatingSection.repeatingSectionHandler);
    }

    static createRowProxy(rowId, section){
        var retval=new Proxy(
            {
                rowId:rowId,  
                prefix:"repeating_"+section
        }, this.repeatingRowHandler);
        return retval;
    }
    //Assuming the layout of pc.repeating.skill.attribute, the repeatingSection handler will return an 
    //object representing pc.repeating.skill.  From this returned object, attributes can be referenced.
    static repeatingSectionHandler={ 
        get: async(obj,section)=>{  
            var retval=[];
            await getSectionIDsAsync("repeating_"+section).then((rowIds)=>{
                rowIds.forEach((rowId)=>{
                    retval.push(orcsRepeatingSection.createRowProxy(rowId, section));
                });
            });
            retval.addRow= function (attribs){
                var newRow = orcsRepeatingSection.createRowProxy(generateRowID(), section);
                if(attribs==null) attribs={};
                for (var prop in attribs) newRow[prop]=attribs[prop];
                return newRow; 
            };
           
            return retval;
            
        }
    };
    static key(obj,prop){
        return obj.prefix+"_"+obj.rowId+"_"+prop;
    }
    static repeatingRowHandler={
        get:(obj,prop)=>{
            if(prop=="delRow") {
                return ()=>{removeRepeatingRow(obj.prefix+"_"+obj.rowId)};
            }
            if(prop=="rowId") return obj.rowId;

            return pc[orcsRepeatingSection.key(obj,prop)]; //this is a promise.  So it is awaitable.
        },
        set:async (obj, prop, value)=>{
            return pc[orcsRepeatingSection.key(obj,prop)]=value;
        }
    };
}
);

//---------------------------------------
//-- 22-orcsCharacter.js
orClientScript.scripts.push(`
class orCharacter{
    constructor(){ }
    
    static create(){
        var retval=new orCharacter();
        return retval.wrap(); 
    }
    
    wrap(){ return new Proxy(this, orCharacter.attrHandler);  }
    static attrHandler = {
        get: (obj, prop)=>{
            switch(prop){
                case "repeating":
                    if(obj.repeating==null) {
                        obj.repeating=orcsRepeatingSection.create(obj); 
                    }
                    return obj.repeating;
                    break;
            }
            return  getSingleAttrAsync(prop);
        },
        set: (obj, prop, value)=>{
           var json='{"'+prop+'":"'+value.replaceAll(/"/gi,'\\"')+'"}';
           return setAttrsAsync(JSON.parse(json));
        }
    };   

}
var pc=orCharacter.create();
`);


//---------------------------------------
//-- 25-orcsTemplates.js
orClientScript.scripts.push(`
class orcsTemplates{
    static templates={}
    static add(templ){
        orcsTemplates.templates={...orcsTemplates.templates, ...templ};
    }
    
    static get(){ return new Proxy(new orcsTemplates(), orcsTemplates.proxyHandler);  }
    
    //encode api commands
    static cmd(p){
        p=p.replace(/\:/ig,"/:").replace(/\"/ig,"%22"); 
        return p;
    }
    static proxyHandler = {
        get: (obj, prop)=>{
            
            var retval=orcsTemplates.templates[prop]; //seed with the passed in template
            if(retval==null) { //if no template found, then try to return any static members of orTemplate
                if(orcsTemplates[prop]!=null) 
                    return orcsTemplates[prop];
                else
                    log("ERROR: Template "+prop+" is not defined.");
                return;
            }

            //return this function to be called inline with the Proxy return, making the whole resolution process syntactically beautiful
            return (params)=>{
                if(params==null) params={__empty:""};
                
                //we call this multiple times to ensure recusion works right
                var resolvePassedInTemplates=(text)=>{
                    //fill any placeholders that values have been specified for 
                    for(var param in params){
                        var p=params[param];
                        if(p==null)p=""; 
                        var rx=new RegExp("{"+param+"}",'ig'); //find each occurance of the parameter
                        text=text.replace(rx,p);  //and replace it
                        text=text.replace(/\\r|\\n/ig,""); //then get rid of all the newlines, to make it compatible with R20
                    }
                    return text;
                };

                var resolveDefinedTemplates=(text)=>{
                    for(var template in orcsTemplates.templates){ //for each template defined
                        text=text.replace(new RegExp("{"+template+"}",'ig'),orcsTemplates.templates[template]); //fill in a placeholder
                        text=resolvePassedInTemplates(text); //then cycle through all the parameters, to fill those in before moving to the next template
                    }
                    return text;
                };
                
                retval=resolveDefinedTemplates(retval);

                var count=1;
                while(count++){
                    var newVal=resolveDefinedTemplates(retval);
                    if(newVal==retval) break;
                    if(count>=10) {
                        log("Error: template resolution exceed max number of nested calls.");
                        break;
                    }
                    retval=newVal;
                }
                return retval;
            }
        }
    }
}

var orTemplates=orcsTemplates.get();
`);
if(orTemplates.includeOnClient) orClientScript.scripts.push(`orTemplates.add(${JSON.stringify(orTemplates.templates)});`);



//---------------------------------------
//-- 26-orcsSendChat.js
class orcsSendChat extends orProcessor{
    onChanged_å(pc){
        var msg=JSON.parse(pc.å);
        if(msg.type=="sendChat"){
            var sendAs=msg.paramsObj[0]||pc.character_name;
            sendChat(sendAs, msg.paramsObj[1],null,msg.paramsObj[2]);
        }
    }
}
new orcsSendChat();

orClientScript.scripts.push(`function sendChat(speakingAs, input, callBackNotSupported=null, options=null){
    orcs.sendData("sendChat",[speakingAs, input, null,options]);
}`);



//---------------------------------------
//-- 27-orcsSend.js
class orcsSend{
    static _all(html, sendAs=null){
        var sendAs=sendAs||orProcessor.who||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs, (sendAs==null?"/desc ":"/direct ")+html);
    }
    static _gm(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs, `/w gm `+html);
    }
    static _actor(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        sendChat(sendAs,`/w ${orProcessor.who} `+html);
    }
    static _gmCopy(html, sendAs=null){
        var sendAs=sendAs||"System";
        if(typeof sendAs =="object") sendAs=sendAs.character_name;
        this._gm(html, sendAs+", to: "+pc.character_name); 
    }
    static all=orSend._wrap(orSend._all);
    static gm=orSend._wrap(orSend._gm);
    static actor=orSend._wrap(orSend._actor);
    static gmCopy=orSend._wrap(orSend._gmCopy);
    static templates=null;
    static registerTemplates(templates){ orSend.templates=templates; }

    static _wrap(f){
        return new Proxy(f, {
                get: (obj, prop)=>{
                    var output = orTemplates.get();
                    return (parameters, sendAs=null)=>{
                        obj(output[prop](parameters, sendAs));
                    }
                }
            }
        );
    }
}


//---------------------------------------
//-- 50-complete.js
log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ORAL ORCS ${orFrameworkProperties.version} is installed.            
┃  Note: Enable ORCS on the client by pasting the following as the first line of your 
┃        Sheet Worker:                
┃                                                                                              
┃    ç=[],µ=on;µ('sheet:opened',i=>getAttrs(['Ω'],v=>(0,eval)(v.Ω)));on=(e,c)=>ç.push([e,c]);  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
