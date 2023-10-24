_**Note:** This framework is in the process of being revamped._

# The ORAL ORCS framework for Roll20  

ORAL ORCS is a framework for Roll20, comprised of two pieces: the “OnyxRing API Library” (ORAL) and the “OnyxRing Client Script” (ORCS). 

Like most frameworks, it abstracts underlying services, simplifying them.  It makes code easier to write, easier to read, and easier to understand.  For example, it makes the act of manipulating character attributes as simple as manipulating properties:

	pc.hitPoints = pc.hitPoints + pc.recovery;

Working with Repeating Sections is also more intuitive with the framework:

```
var totAtkPower = 0;
pc.repeating.spells.forEach(spell=>{
      	if(spell.isAttack=="on") totAtkPower = totAtkPower + spell.power;
	if(spell.isExpended=="on") spell.delRow();
});
```

Among its features, ORAL ORCS includes recursive templates, custom dice rolling, and simplified command processors.  The native functions setTimeout() and setInterval() now work correctly in Sheetworkers, as does sendChat().  

The lion's share of the documentation for this framework is embedded in the ORALORCS.pdf file.
