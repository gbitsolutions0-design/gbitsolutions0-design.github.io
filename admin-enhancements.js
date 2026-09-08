/* GB IT Solutions admin enhancements */
(function(){
  'use strict';
  if(window.__GB_ADMIN_ENHANCEMENTS_LOADED)return;
  window.__GB_ADMIN_ENHANCEMENTS_LOADED=true;
  const client=(typeof db!=='undefined'&&db)?db:(typeof supabase!=='undefined'&&typeof SUPABASE_URL!=='undefined'&&typeof SUPABASE_ANON_KEY!=='undefined'?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null);
  if(!client)return;

  // Automatically sign out after 5 minutes of inactivity.
  const IDLE_LIMIT=5*60*1000;let idleTimer;
  function resetIdleTimer(){
    clearTimeout(idleTimer);
    const dash=document.getElementById('dash');
    if(!dash||dash.classList.contains('hidden'))return;
    idleTimer=setTimeout(async()=>{
      try{await client.auth.signOut()}catch(e){}
      alert('Admin session expired after 5 minutes of inactivity. Please login again.');
      location.reload();
    },IDLE_LIMIT);
  }
  ['click','keydown','mousemove','scroll','touchstart'].forEach(ev=>document.addEventListener(ev,resetIdleTimer,{passive:true}));
  if(client.auth&&client.auth.onAuthStateChange){client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')resetIdleTimer();if(event==='SIGNED_OUT')clearTimeout(idleTimer);});}
  setTimeout(resetIdleTimer,1000);

  const nav=document.querySelector('.tabs'),dash=document.querySelector('#dash');
  if(!nav||!dash)return;
  if(document.getElementById('images'))return;
  const panel=document.createElement('section');
  panel.id='images';panel.className='panel hidden';
  panel.innerHTML=`<div class="row"><h3 style="margin:0 auto 0 0">🖼️ Images / Gallery</h3><button type="button" id="refreshImages">Refresh</button></div>
  <p class="muted">Add website images from here. Choose an image file from your computer or paste an image URL.</p>
  <form id="imageForm" class="formgrid" style="grid-template-columns:1.4fr 2fr 1fr 1fr auto">
    <input id="imageTitle" placeholder="Image title" required>
    <input id="imageUrl" placeholder="Image URL (optional)">
    <select id="imageSection"><option value="gallery">Gallery</option><option value="home">Home</option><option value="services">Services</option></select>
    <input id="imageFile" type="file" accept="image/*">
    <button type="submit">+ Add Image</button>
  </form><br><div id="imageMsg" class="muted"></div>
  <div class="table"><table><thead><tr><th>Preview</th><th>Title</th><th>Section</th><th>Visible</th><th>Actions</th></tr></thead><tbody id="imageRows"></tbody></table></div>`;
  dash.appendChild(panel);
  let tab=[...nav.querySelectorAll('button')].find(b=>b.textContent.includes('Images / Gallery'));
  if(!tab){tab=document.createElement('button');tab.type='button';tab.textContent='🖼️ Images / Gallery';nav.appendChild(tab);}
  tab.addEventListener('click',showImages);
  function showImages(){['bookings','services','products','images'].forEach(x=>{const el=document.getElementById(x);if(el)el.classList.toggle('hidden',x!=='images')});loadImages()}
  window.showImages=showImages;
  async function loadImages(){
    const msg=document.getElementById('imageMsg'),body=document.getElementById('imageRows');
    const {data,error}=await client.from('site_images').select('*').order('sort_order',{ascending:true});
    if(error){msg.innerHTML='⚠️ Image table is not ready. Create <b>site_images</b> in Supabase SQL Editor first.<br><small>'+esc(error.message)+'</small>';return;}
    body.innerHTML=(data||[]).map(x=>`<tr><td><img src="${attr(x.image_url)}" style="width:90px;height:60px;object-fit:cover;border-radius:8px"></td><td>${esc(x.title)}</td><td>${esc(x.section||'gallery')}</td><td><input type="checkbox" ${x.active?'checked':''} onchange="toggleImage('${x.id}',this.checked)"></td><td><button type="button" class="danger" onclick="deleteImage('${x.id}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">No images added yet.</td></tr>';
  }
  window.loadImages=loadImages;
  window.toggleImage=async function(id,active){const {error}=await client.from('site_images').update({active}).eq('id',id);if(error)alert(error.message)};
  window.deleteImage=async function(id){if(!confirm('Delete this image?'))return;const {error}=await client.from('site_images').delete().eq('id',id);if(error)alert(error.message);else loadImages()};
  document.getElementById('refreshImages').onclick=loadImages;
  document.getElementById('imageForm').onsubmit=async function(e){
    e.preventDefault();const msg=document.getElementById('imageMsg');msg.textContent='Adding image...';
    let url=document.getElementById('imageUrl').value.trim();const file=document.getElementById('imageFile').files[0];
    if(!url&&!file){msg.textContent='Please choose an image file or paste an image URL.';return;}
    if(file){if(file.size>1500000){msg.textContent='Please use an image smaller than 1.5 MB.';return;}url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});}
    const {error}=await client.from('site_images').insert({title:document.getElementById('imageTitle').value.trim(),image_url:url,section:document.getElementById('imageSection').value,active:true,sort_order:Date.now()});
    if(error){msg.textContent=error.message;return;}e.target.reset();msg.textContent='✅ Image added successfully.';loadImages();
  };
  function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function attr(v){return esc(v)}
})();
