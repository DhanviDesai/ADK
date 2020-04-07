

const publicVapidKey = 'BA4ZLGAnv5fDvz_IfK1UYmCIkfEJjMVjQCmExPE6Dj9lawEahIYpKwI_UZbR6l5rXuvSHdGL_sy_S4RFH1NEGYE';

if('serviceWorker' in navigator){
  console.log('Registering service worker');
  run().catch(error =>{
    console.log(error);
  });
}

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function run(){
    console.log('Registering service worker');
    const registration = await navigator.serviceWorker.
      register('worker.js');
    console.log('Registered service worker');

    if (!('PushManager' in window)) {
           console.log('Push messaging isn\'t supported.');
           return;
         }

    console.log('registering push');
    const subscription = await registration.pushManager.
    subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(publicVapidKey)
    });
    console.log('registered push');



    console.log('sending push');
    await fetch('/subscribe',{
      method: 'POST',
      body:JSON.stringify(subscription),
      headers:{
        'content-type':'application/json'
      }
    });
    console.log('sent push');
    console.log('registered service worker');


  }
