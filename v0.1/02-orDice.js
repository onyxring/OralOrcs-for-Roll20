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


