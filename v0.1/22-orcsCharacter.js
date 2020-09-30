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
