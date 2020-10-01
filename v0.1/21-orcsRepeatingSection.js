orClientScript.scripts.push(`
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
}`
);