/* GB IT Solutions booking, enquiry and gallery enhancements */
(function(){
  'use strict';
  const ADMIN_EMAIL='gbitsolutions0@gmail.com';
  const EMAIL_ENDPOINT='https://formsubmit.co/ajax/'+ADMIN_EMAIL;
  const WA='918898057804';

  function goBooking(){
    const target=document.querySelector('#booking,[id="booking"],.booking');
    if(target){target.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const form=document.querySelector('form'); if(form)form.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function enquire(btn){
    const card=btn.closest('.card')||btn.parentElement;
    const title=card?.querySelector('h3')?.textContent?.trim()||'IT Service';
    const desc=card?.querySelector('p')?.textContent?.trim()||'';
    const msg=`Hello GB IT SOLUTIONS, I want to enquire about: ${title}${desc?'\n'+desc:''}`;
    window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg),'_blank');
  }
  document.addEventListener('click',function(e){
    const btn=e.target.closest('button,a'); if(!btn)return;
    const text=(btn.textContent||'').trim().toLowerCase();
    if(text==='book'||text.startsWith('book ')){e.preventDefault();goBooking();return;}
    if(text==='enquire'||text.startsWith('enquire ')||text.includes('enquire on whatsapp')){e.preventDefault();enquire(btn);return;}
  },true);

  const originalFetch=window.fetch;
  window.fetch=async function(input,init){
    const response=await originalFetch.apply(this,arguments);
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      const method=((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
      if(method==='POST'&&/\/rest\/v1\/bookings(?:\?|$)/i.test(url)){
        const raw=init&&init.body;
        if(raw){try{const parsed=JSON.parse(raw);const records=Array.isArray(parsed)?parsed:[parsed];if(response.ok)records.forEach(sendBookingEmail)}catch(_e){}}
      }
    }catch(_e){}
    return response;
  };
  async function sendBookingEmail(b){
    try{await originalFetch(EMAIL_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:'New GB IT Solutions Booking - '+(b.reference||'Pending'),_captcha:'false',_template:'table','Booking Reference':b.reference||'','Customer Name':b.full_name||'','Mobile':b.mobile||'','Email':b.email||'','Service':b.service||'','Device':b.device_type||'','Preferred Date/Time':b.preferred_datetime||'','Address':b.address||'','Problem':b.problem||'','Status':b.status||'Pending'})})}catch(_e){}
  }

  async function loadGallery(){
    if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return;
    try{
      const db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
      const {data,error}=await db.from('site_images').select('*').eq('active',true).order('sort_order',{ascending:true});
      if(error||!data?.length)return;
      let section=document.querySelector('#gallery');
      if(!section){section=document.createElement('section');section.id='gallery';section.innerHTML='<div class="wrap"><div class="head"><div><span class="eyebrow">OUR WORK</span><h2>Gallery</h2><p>Recent GB IT SOLUTIONS work and services.</p></div></div><div class="grid" id="gbGalleryGrid"></div></div>';const footer=document.querySelector('footer');(footer?.parentNode||document.body).insertBefore(section,footer||null)}
      const grid=section.querySelector('#gbGalleryGrid'); if(!grid)return;
      grid.innerHTML=data.map(x=>`<article class="card"><img src="${safe(x.image_url)}" alt="${safe(x.title)}" loading="lazy" style="width:100%;height:210px;object-fit:cover;border-radius:12px"><h3>${safe(x.title)}</h3></article>`).join('');
    }catch(_e){}
  }
  function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadGallery);else loadGallery();
})();
