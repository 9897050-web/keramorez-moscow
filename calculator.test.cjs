const assert=require('node:assert/strict');
const {calculateDetail,calculateOrder}=require('./calculator.js');
const base={length:1200,width:600,quantity:1,thickness:'standard',angle:'90',customAngle:30,edges:['top'],holes:0,diameter:'10'};
const all=['top','bottom','left','right'];
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('minimum applies to entire order',()=>{assert.equal(calculateOrder([base,base]).total,2000);});
check('45-degree perimeter, 2 pieces, two 50mm holes per piece',()=>{const r=calculateOrder([{...base,angle:'45',edges:all,quantity:2,holes:2,diameter:'50'}]);assert.equal(r.meters,7.2);assert.equal(r.cutCost,3240);assert.equal(r.holeCost,2000);assert.equal(r.total,5240);});
check('format boundary 1200/1201/1500/1501',()=>{assert.equal(calculateDetail(base).rate,200);assert.equal(calculateDetail({...base,length:1201}).rate,200);assert.equal(calculateDetail({...base,length:1500,angle:'45'}).rate,450);assert.equal(calculateOrder([{...base,length:1501}]).total,null);});
check('manual work never produces misleading final total',()=>{for(const variant of [{thickness:'thick'},{thickness:'thin'},{angle:'custom'},{holes:1,diameter:'custom'}])assert.equal(calculateOrder([base,{...base,...variant}]).total,null);});
check('hole-only order',()=>{const r=calculateOrder([{...base,edges:[],holes:2,diameter:'120'}]);assert.equal(r.total,2400);assert.equal(r.meters,0);});
check('reject empty, negative, fractional and invalid inputs',()=>{for(const variant of [{length:0},{width:-5},{quantity:1.5},{holes:NaN},{quantity:1001},{edges:[]},{length:Infinity},{holes:1,diameter:'bad'},{angle:'custom',customAngle:180}])assert.equal(calculateDetail({...base,...variant}).valid,false);});
check('mixed 90 and 45 edges do not double-charge same tariff',()=>{const r=calculateOrder([{...base,quantity:10},{...base,angle:'45',edges:['left'],quantity:10}]);assert.equal(r.total,5100);});
console.log(checks+' meaningful calculation checks passed');
