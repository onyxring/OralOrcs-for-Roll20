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

