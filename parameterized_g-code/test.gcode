; This is a test
T{{PRINTING_HEAD}}
M104 T{{#ifEquals PRINTING_HEAD 1}}0{{else}}1{{/ifEquals}} S0
G29 P1 X30 Y0 W{{#ifEquals PRINTING_HEAD 1}}130{{else}}50{{/ifEquals}} H20 C

{{#switch 1 ~}}
{{#case 0 ~}}100{{~/case}}
{{#caseMultiple "1,2" ~}}M104 T{{PRINTING_HEAD}} S70{{~/caseMultiple}}
{{~/switch}}

