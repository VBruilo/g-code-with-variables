; This is a test
T{{PRINTING_HEAD}}
M104 T{{#ifEquals PRINTING_HEAD 1}}0{{else}}1{{/ifEquals}} S0
G29 P1 X30 Y0 W{{#ifEquals PRINTING_HEAD 1}}130{{else}}50{{/ifEquals}} H20 C