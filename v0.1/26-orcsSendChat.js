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

