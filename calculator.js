(function(root){
  'use strict';
  const MINIMUM=2000;
  const HOLE_RATES={10:100,50:500,100:1000,120:1200};
  function calculateDetail(d){
    const errors=[];
    if(!Number.isInteger(d.length)||d.length<20||d.length>5000)errors.push('Длина: целое число от 20 до 5 000 мм.');
    if(!Number.isInteger(d.width)||d.width<20||d.width>5000)errors.push('Ширина: целое число от 20 до 5 000 мм.');
    if(!Number.isInteger(d.quantity)||d.quantity<1||d.quantity>1000)errors.push('Количество: целое число от 1 до 1 000.');
    if(!Number.isInteger(d.holes)||d.holes<0||d.holes>100)errors.push('Отверстия: целое число от 0 до 100 на деталь.');
    if(!Array.isArray(d.edges)||d.edges.some(e=>!['top','bottom','left','right'].includes(e)))errors.push('Выберите стороны обработки.');
    if(!['90','45','custom'].includes(d.angle))errors.push('Выберите угол обработки.');
    if(!['standard','thin','thick'].includes(d.thickness))errors.push('Выберите толщину.');
    if(d.angle==='custom'&&(!Number.isFinite(d.customAngle)||d.customAngle<1||d.customAngle>179))errors.push('Угол: от 1 до 179 градусов.');
    if(d.holes>0&&d.diameter!=='custom'&&!HOLE_RATES[d.diameter])errors.push('Выберите диаметр отверстия.');
    if(Array.isArray(d.edges)&&d.edges.length===0&&d.holes===0)errors.push('Выберите хотя бы одну сторону или добавьте отверстие.');
    if(errors.length)return {valid:false,errors};
    const sides=[...new Set(d.edges)];
    const meters=sides.reduce((s,e)=>s+(['top','bottom'].includes(e)?d.length:d.width),0)*d.quantity/1000;
    const maxSide=Math.max(d.length,d.width);
    const reasons=[];
    if(maxSide>1500)reasons.push('формат свыше 1 500 мм');
    if(d.thickness!=='standard')reasons.push('толщина вне диапазона 6–12 мм');
    if(sides.length&&d.angle==='custom')reasons.push('нестандартный угол');
    if(d.holes>0&&d.diameter==='custom')reasons.push('нестандартное отверстие или вырез');
    const rate=d.angle==='45'?(maxSide>1200?500:450):(maxSide>1200?250:150);
    const manual=reasons.length>0;
    const cutCost=manual?0:Math.round(meters*rate*100)/100;
    const holeCost=manual?0:d.holes*d.quantity*(HOLE_RATES[d.diameter]||0);
    return {valid:true,meters,rate,manual,reasons,cutCost,holeCost,cost:cutCost+holeCost};
  }
  function calculateOrder(details){
    const items=details.map(calculateDetail);
    if(!items.length||items.some(x=>!x.valid))return {valid:false};
    const cutCost=items.reduce((s,x)=>s+x.cutCost,0),holeCost=items.reduce((s,x)=>s+x.holeCost,0);
    const subtotal=Math.round((cutCost+holeCost)*100)/100;
    const manual=items.some(x=>x.manual);
    return {valid:true,items,cutCost,holeCost,subtotal,manual,meters:items.reduce((s,x)=>s+x.meters,0),minimum:manual?0:Math.max(0,MINIMUM-subtotal),total:manual?null:Math.max(MINIMUM,subtotal)};
  }
  const api={MINIMUM,HOLE_RATES,calculateDetail,calculateOrder};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.KeramoCalc=api;
})(typeof window!=='undefined'?window:globalThis);
