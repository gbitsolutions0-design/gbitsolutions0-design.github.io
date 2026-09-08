/* GB IT Solutions admin image manager */
(function(){
  'use strict';
  const db = window.db || (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY ? supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null);
  if(!db) return;
  const nav=document.querySelector('.tabs'), dash=document.querySelector('#dash');
  if(!nav||!dash) return;
  const panel=document.createElement('section'); panel.id='images'; panel.className='panel hidden';
  panel.innerHTML=`<div class="row"><h3 style="margin:0 auto 0 0">🖼️ Images / Gallery</h3><button type="button" id="refreshImages">Refresh</button></div>
  <p class="muted">Upload an image from your computer or paste an image URL. It will appear in the website Gallery.</p>
  <form id="imageForm" class="formgrid" style="grid-template-columns:1.4fr 2fr 1fr 1fr auto">
    <input id="imageTitle" placeholder="Image title" required>
    <input id="imageUrl" placeholder="Image URL (optional)">
    <select id="imageSection"><option value="gallery">Gallery</option><option value="home">Home</option><option value="services">Services</option></select>
    <input id="imageFile" type="file" accept="image/*">
    <button type="submit">+ Add Image</button>
  </form><br><div id="imageMsg" class="muted"></div>
  <div class="table"><table><thead><tr><th>Preview</th><th>Title</th><th>Section</th><th>Visible</th><th>Actions</th></tr></thead><tbody id="imageRows"></tbody></table></div>`;
  dash.appendChild(panel);
  const tab=document.createElement('button'); tab.type='button'; tab.textContent='🖼️ Images / Gallery'; nav.appendChild(tab);
  tab.addEventListener('click',showImages);
  function hideOthers(){['bookings','services','products','images'].forEach(x=>{const el=document.getElementById(x);if(el)el.classList.toggle('hidden',x!=='images')})}
  function showImages(){hideOthers();loadImages()}
  window.showImages=showImages;
  window.loadImages=async function(){
    const msg=document.getElementById('imageMsg'), body=document.getElementById('imageRows');
    const {data,error}=await db.from('site_images').select('*').order('sort_order',{ascending:true});
    if(error){msg.textContent='Image database table is not ready. Please run the SQL below once in Supabase SQL Editor.';msg.innerHTML+=`<pre style="white-space:pre-wrap;background:#070c15;padding:12px;border-radius:10px;overflow:auto">create table if not exists public.site_images (id uuid primary key default gen_random_uuid(), title text not null, image_url text not null, section text default 'gallery', active boolean default true, sort_order bigint default 0, created_at timestamptz default now()); alter table public.site_images enable row level security; create policy "site images read" on public.site_images for select to authenticated using (true); create policy "site images insert" on public.site_images for insert to authenticated with check (true); create policy "site images update" on public.site_images for update to authenticated using (true) with check (true); create policy "site images delete" on public.site_images for delete to authenticated using (true);</pre>`;return}
    body.innerHTML=(data||[]).map(x=>`<tr><td><img src="${attr(x.image_url)}" style="width:90px;height:60px;object-fit:cover;border-radius:8px"></td><td>${esc(x.title)}</td><td>${esc(x.section||'gallery')}</td><td><input type="checkbox" ${x.active?'checked':''} onchange="toggleImage('${x.id}',this.checked)"></td><td><button type="button" class="danger" onclick="deleteImage('${x.id}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">No images added yet.</td></tr>';
  };
  window.toggleImage=async function(id,active){const {error}=await db.from('site_images').update({active}).eq('id',id);if(error)alert(error.message)};
  window.deleteImage=async function(id){if(!confirm('Delete this image?'))return;const {error}=await db.from('site_images').delete().eq('id',id);if(error)alert(error.message);else loadImages()};
  document.getElementById('refreshImages').onclick=loadImages;
  document.getElementById('imageForm').onsubmit=async function(e){
    e.preventDefault();const msg=document.getElementById('imageMsg');msg.textContent='Adding image...';
    let url=document.getElementById('imageUrl').value.trim();const file=document.getElementById('imageFile').files[0];
    if(!url&&!file){msg.textContent='Please choose an image file or paste an image URL.';return}
    if(file){if(file.size>1500000){msg.textContent='Please use an image smaller than 1.5 MB.';return}url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
    const {error}=await db.from('site_images').insert({title:document.getElementById('imageTitle').value.trim(),image_url:url,section:document.getElementById('imageSection').value,active:true,sort_order:Date.now()});
    if(error){msg.textContent=error.message;return}e.target.reset();msg.textContent='✅ Image added successfully.';loadImages();
  };
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function attr(v){return esc(v)}
})();
