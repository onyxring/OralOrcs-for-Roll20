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
