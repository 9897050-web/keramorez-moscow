'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
const rub=n=>fmt(n)+' ₽';
const edgeNames={top:'верхняя',bottom:'нижняя',left:'левая',right:'правая'};
let saved=[],includeCurrent=true,lastOrder=null;
function readDetail(){return {length:Number($('length').value),width:Number($('width').value),quantity:Number($('quantity').value),thickness:$('thickness').value,angle:document.querySelector('[name=angle]:checked').value,customAngle:Number($('custom-angle').value),edges:[...document.querySelectorAll('[name=edge]:checked')].map(x=>x.value),holes:$('holes').value===''?NaN:Number($('holes').value),diameter:$('diameter').value};}
function allDetails(){return includeCurrent?[...saved,readDetail()]:saved;}
function update(){
  const d=readDetail(),current=KeramoCalc.calculateDetail(d);
  $('custom-angle-wrap').hidden=d.angle!=='custom';
  $('dim-length').textContent=Number.isFinite(d.length)?fmt(d.length)+' мм':'—';
  $('dim-width').textContent=Number.isFinite(d.width)?fmt(d.width)+' мм':'—';
  $('tile-angle').textContent=d.angle==='custom'?(Number.isFinite(d.customAngle)?d.customAngle+'°':'?'):d.angle+'°';
  const ratio=Math.max(.2,Math.min(5,d.length/d.width||2));
  $('tile').style.width=(ratio>=1?220:120*ratio)+'px';
  $('tile').style.height=(ratio>=1?Math.min(130,220/ratio):120)+'px';
  for(const e of ['top','bottom','left','right'])document.querySelector('.edge.'+e).classList.toggle('selected',d.edges.includes(e));
  $('validation').textContent=current.valid?'':current.errors.join(' ');
  $('add-detail').disabled=!current.valid||!includeCurrent;
  $('add-detail').firstChild.textContent=includeCurrent?'Добавить в список деталей ':'Деталь добавлена — измените параметры ';
  const order=KeramoCalc.calculateOrder(allDetails());lastOrder=order;
  $('download-estimate').disabled=!order.valid;$('copy-estimate').disabled=!order.valid;
  $('copy-status').textContent='';
  if(!order.valid){$('total').textContent='—';$('estimate-label').textContent='Проверьте параметры детали';for(const id of ['cut-length','cut-price','hole-price','minimum-price'])$(id).textContent='—';$('manual-note').hidden=true;return;}
  $('total').innerHTML=order.manual?'По чертежу':fmt(order.total)+' <span>₽</span>';
  $('estimate-label').textContent=order.manual?'Нужен индивидуальный расчёт':order.minimum>0?'С учётом минимального заказа':'Предварительная стоимость обработки';
  $('cut-length').textContent=fmt(order.meters)+' м';
  $('cut-price').textContent=(order.manual?'Известная часть: ':'')+rub(order.cutCost);
  $('hole-price').textContent=(order.manual?'Известная часть: ':'')+rub(order.holeCost);
  $('minimum-row').hidden=order.manual;$('minimum-price').textContent=rub(order.minimum);
  $('manual-note').hidden=!order.manual;
  $('manual-note').textContent='Требуется уточнение: '+[...new Set(order.items.flatMap(x=>x.reasons))].join(', ')+'. Полная цена не рассчитана. Минимальная стоимость обработки — 2 000 ₽.';
  $('current-note').textContent=includeCurrent?(saved.length?'В расчёте: '+saved.length+' сохранённых поз. + текущая деталь':'В расчёте: текущая деталь'):'В расчёте: '+saved.length+' поз. Чтобы добавить следующую деталь, измените параметры.';
  renderSaved();
}
function renderSaved(){const list=$('detail-list');list.replaceChildren();saved.forEach((d,i)=>{const result=KeramoCalc.calculateDetail(d),row=document.createElement('div');row.className='detail-row';const info=document.createElement('div');info.textContent=(i+1)+'. '+d.length+' × '+d.width+' мм · '+d.quantity+' шт.';const sub=document.createElement('small');sub.textContent=(d.angle==='custom'?d.customAngle:d.angle)+'° · '+fmt(result.meters)+' м · '+(result.manual?'по чертежу':rub(result.cost));info.append(sub);const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Удалить деталь '+(i+1));remove.addEventListener('click',()=>{saved.splice(i,1);if(!saved.length)includeCurrent=true;update();});row.append(info,remove);list.append(row);});}
function summary(){const order=KeramoCalc.calculateOrder(allDetails());if(!order.valid)return '';const lines=['КЕРАМОРЕЗ — предварительный расчёт','Москва · +7 985 986-25-64','Дата: '+new Date().toLocaleDateString('ru-RU'),''];allDetails().forEach((d,i)=>{const r=order.items[i];lines.push('Деталь '+(i+1)+': '+d.length+' × '+d.width+' мм; '+d.quantity+' шт.','Толщина: '+({standard:'6–12 мм',thin:'менее 6 мм',thick:'более 12 мм'}[d.thickness]),'Угол: '+(d.angle==='custom'?d.customAngle:d.angle)+'°; стороны: '+(d.edges.map(e=>edgeNames[e]).join(', ')||'без обработки сторон'),'Длина обработки: '+fmt(r.meters)+' м. Отверстия: '+d.holes+' на деталь; диаметр: '+(d.diameter==='custom'?'по чертежу':d.diameter+' мм'),r.manual?'Цена по чертежу: '+r.reasons.join(', '):'Резка: '+rub(r.cutCost)+' ('+rub(r.rate)+'/м); отверстия: '+rub(r.holeCost)+'; сумма: '+rub(r.cost),'');});lines.push(order.manual?'ИТОГО: требуется индивидуальный расчёт. Полная сумма не определена.':'ИТОГО: '+rub(order.total)+' (доплата до минимального заказа: '+rub(order.minimum)+')','Минимальная стоимость обработки — 2 000 ₽.','Материал, доставка, монтаж, полировка и склейка не включены.','Цена и срок подтверждаются после проверки материала и чертежа.','Этот расчёт не отправлен в мастерскую. Для согласования позвоните: +7 985 986-25-64.');return lines.join('\n');}
$('calc-form').addEventListener('input',()=>{includeCurrent=true;update();});
$('calc-form').addEventListener('change',()=>{includeCurrent=true;update();});
$('calc-form').addEventListener('submit',e=>e.preventDefault());
$('add-detail').addEventListener('click',()=>{const d=readDetail();if(!KeramoCalc.calculateDetail(d).valid||!includeCurrent)return;saved.push(d);includeCurrent=false;update();});
$('reset').addEventListener('click',()=>{saved=[];includeCurrent=true;$('calc-form').reset();update();});
$('download-estimate').addEventListener('click',()=>{const text=summary();if(!text)return;const blob=new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='keramorez-raschet.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('copy-estimate').addEventListener('click',async()=>{const text=summary();if(!text)return;try{await navigator.clipboard.writeText(text);$('copy-status').textContent='Расчёт скопирован. Его можно отправить после согласования способа связи.';}catch{$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').select();}});
$('close-dialog').addEventListener('click',()=>$('copy-dialog').close());
document.querySelectorAll('[data-operation]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('[name=angle][value="'+a.dataset.operation+'"]').checked=true;includeCurrent=true;update();}));
update();
