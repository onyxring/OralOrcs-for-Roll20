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