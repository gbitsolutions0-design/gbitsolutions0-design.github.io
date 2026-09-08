/* GB IT Solutions booking enhancements */
(function(){
  'use strict';
  const ADMIN_EMAIL = 'gbitsolutions0@gmail.com';
  const EMAIL_ENDPOINT = 'https://formsubmit.co/ajax/' + ADMIN_EMAIL;

  function goBooking(){
    const target = document.querySelector('#booking, [id="booking"], .booking');
    if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); return; }
    const form = document.querySelector('form');
    if(form) form.scrollIntoView({behavior:'smooth', block:'start'});
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('button, a');
    if(!btn) return;
    const text = (btn.textContent || '').trim().toLowerCase();
    if(text === 'book' || text.startsWith('book ')){
      e.preventDefault();
      goBooking();
    }
  }, true);

  const originalFetch = window.fetch;
  window.fetch = async function(input, init){
    const response = await originalFetch.apply(this, arguments);
    try{
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      if(method === 'POST' && /\/rest\/v1\/bookings(?:\?|$)/i.test(url)){
        let raw = init && init.body;
        if(raw){
          try{
            const parsed = JSON.parse(raw);
            const records = Array.isArray(parsed) ? parsed : [parsed];
            if(response.ok) records.forEach(sendBookingEmail);
          }catch(_e){}
        }
      }
    }catch(_e){}
    return response;
  };

  async function sendBookingEmail(b){
    try{
      const ref = b.reference || b.booking_reference || 'Pending';
      const payload = {
        _subject: 'New GB IT Solutions Booking - ' + ref,
        _captcha: 'false',
        _template: 'table',
        'Booking Reference': ref,
        'Customer Name': b.full_name || '',
        'Mobile': b.mobile || '',
        'Email': b.email || '',
        'Service': b.service || '',
        'Device': b.device_type || '',
        'Preferred Date/Time': b.preferred_datetime || '',
        'Address': b.address || '',
        'Problem': b.problem || '',
        'Status': b.status || 'Pending'
      };
      await originalFetch(EMAIL_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
    }catch(_e){}
  }
})();
