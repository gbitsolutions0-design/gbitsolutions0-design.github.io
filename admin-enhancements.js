/* GB IT Solutions admin image manager */
(function(){
  'use strict';
  const db = window.db || (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY ? supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null);
  if(!db) return;
  const nav = document.querySelector('.tabs');
  const dash = document.querySelector('#dash');
  if(!nav || !dash) return;

  const panel = document.createElement('section');
  panel.id='images'; panel.className='panel hidden';
  panel.innerHTML=`<div class="row"><h3 style="margin:0 auto 0 0">🖼️ Images / Gallery</h3><button onclick="loadImages()">Refresh</button></div>
  <p class="muted">Add website images from here. You can paste an image URL or choose a small image file.</p>
  <form id="imageForm" class="formgrid" style="grid-template-columns:1.5fr 2fr 1fr 1fr auto">
    <input id="imageTitle" placeholder="Image title" required>
    <input id="imageUrl" placeholder="Image URL (optional)">
    <select id="imageSection"><option value="gallery">Gallery</option><option value="home">Home</option><option value="services">Services</option></select>
    <input id="imageFile" type="file" accept="image/*">
    <button>+ Add Image</button>
  </form><br>
  <div id="imageMsg" class="muted"></div>
  <div class="table"><table><thead><tr><th>Preview</th><th>Title</th><th>Section</th><th>Visible</th><th>Actions</th></tr></thead><tbody id="imageRows"></tbody></table></div>`;
  dash.appendChild(panel);
  const tab=document.createElement('button'); tab.textContent='🖼️ Images / Gallery'; tab.onclick=()=>showImages(); nav.appendChild(tab);

  window.showImages=function(){ ['bookings','services','products','images'].forEach(x=>{const el=document.getElementById(x); if(el) el.classList.toggle('hidden',x!=='images')}); loadImages(); };
  window.loadImages=async function(){
    const {data,error}=await db.from('site_images').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(error){imageMsg.textContent='Image table is not ready yet. Run the SQL shown below once in Supabase SQL Editor.'; imageMsg.innerHTML += '<pre style="white-space:pre-wrap;background:#070c15;padding:12px;border-radius:10px;overflow:auto">create table if not exists public.site_images (id uuid primary key default gen_random_uuid(), title text not null, image_url text not null, section text default \'gallery\', active boolean default true, sort_order integer default 0, created_at timestamptz default now()); alter table public.site_images enable row level security; create policy "admin read images" on public.site_images for select to authenticated using (true); create policy "admin insert images" on public.site_images for insert to authenticated with check (true); create policy "admin update images" on public.site_images for update to authenticated using (true) with check (true); create policy "admin delete images" on public.site_images for delete to authenticated using (true);</pre>'; return;}
    imageRows.innerHTML=(data||[]).map(x=>`<tr><td><img src="${attr(x.image_url)}" style="width:90px;height:60px;object-fit:cover;border-radius:8px"></td><td>${esc(x.title)}</td><td>${esc(x.section||'gallery')}</td><td><input type="checkbox" ${x.active?'checked':''} onchange="toggleImage('${x.id}',this.checked)"></td><td><button class="danger" onclick="deleteImage('${x.id}')">Delete</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No images added yet.</td></tr>';
  };
  window.toggleImage=async function(id,active){const {error}=await db.from('site_images').update({active}).eq('id',id);if(error)alert(error.message)};
  window.deleteImage=async function(id){if(!confirm('Delete this image?'))return;const {error}=await db.from('site_images').delete().eq('id',id);if(error)alert(error.message);else loadImages()};
  document.getElementById('imageForm').onsubmit=async function(e){
    e.preventDefault(); imageMsg.textContent='Adding image...';
    let url=imageUrl.value.trim();
    const file=imageFile.files[0];
    if(!url && !file){imageMsg.textContent='Please paste an image URL or choose an image file.';return;}
    if(file){ if(file.size>1500000){imageMsg.textContent='Please use an image smaller than 1.5 MB.';return;} url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)}); }
    const {data,error}=await db.from('site_images').insert({title:imageTitle.value.trim(),image_url:url,section:imageSection.value,active:true,sort_order:Date.now()}).select();
    if(error){imageMsg.textContent=error.message;return;} e.target.reset(); imageMsg.textContent='Image added successfully.'; loadImages();
  };
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} function attr(v){return esc(v)}
})();
