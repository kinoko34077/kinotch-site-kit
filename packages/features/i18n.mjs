/**
 * Opt-in i18next resource adapter. Importing this file DOES NOT import or
 * initialize i18next; createLocalization explicitly imports the pinned peer.
 * No backend plugin, locale detection, HTTP, storage, telemetry or Locize.
 */
const LOCALE=/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;
const KEY=/^[A-Za-z][A-Za-z0-9_.-]{0,119}$/;
function plain(x){
  return x!==null&&typeof x==='object'&&!Array.isArray(x)&&
    Object.getPrototypeOf(x)===Object.prototype;
}
function validate(resources, language, fallback) {
  if(!plain(resources)||!Object.keys(resources).length||Object.keys(resources).length>16){
    throw new TypeError('resource languages must be 1..16 explicit locale dictionaries');
  }
  const safe={};
  for(const [locale,dictionary] of Object.entries(resources)){
    if(!LOCALE.test(locale)||!plain(dictionary)||Object.keys(dictionary).length>1000){
      throw new TypeError('invalid locale dictionary: '+locale);
    }
    const translations={};
    for(const [key,text] of Object.entries(dictionary)){
      if(!KEY.test(key)||typeof text!=='string'||text.length>10000){
        throw new TypeError('invalid translation key/value: '+key);
      }
      translations[key]=text;
    }
    safe[locale]={translation:translations};
  }
  if(!Object.prototype.hasOwnProperty.call(safe,language)||
     !Object.prototype.hasOwnProperty.call(safe,fallback)){
    throw new TypeError('selected and fallback languages must have explicit dictionaries');
  }
  return safe;
}
export async function createLocalization({resources,language='ja',fallbackLanguage='ja'}={}){
  // Fail before importing any optional runtime dependency for invalid configs.
  const explicit=validate(resources,language,fallbackLanguage);
  const {createInstance}=await import('i18next');
  const instance=createInstance();
  await instance.init({
    resources:explicit,lng:language,fallbackLng:fallbackLanguage,
    supportedLngs:Object.keys(explicit),nonExplicitSupportedLngs:false,
    ns:['translation'],defaultNS:'translation',keySeparator:false,nsSeparator:false,
    interpolation:{escapeValue:true},returnNull:false,
    initImmediate:false,saveMissing:false,debug:false
  });
  let disposed=false,chain=Promise.resolve();
  const listeners=new Set();
  function open(){if(disposed)throw new Error('localization disposed');}
  const api={
    get language(){return instance.language;},
    available(){return Object.keys(explicit);},
    direction(){
      open();
      return new Intl.Locale(instance.language).textInfo?.direction??'ltr';
    },
    t(key,options){
      open();
      if(typeof key!=='string'||!KEY.test(key))throw new TypeError('invalid key');
      return instance.t(key,options??{});
    },
    formatNumber(number,options={}){
      open();
      if(typeof number!=='number'||!Number.isFinite(number))throw new TypeError('number must be finite');
      return new Intl.NumberFormat(instance.language,options).format(number);
    },
    formatDate(date,options={}){
      open();
      const d=date instanceof Date?date:new Date(date);
      if(Number.isNaN(d.getTime()))throw new TypeError('invalid date');
      return new Intl.DateTimeFormat(instance.language,options).format(d);
    },
    subscribe(callback){
      open();
      if(typeof callback!=='function')throw new TypeError('callback required');
      listeners.add(callback);
      return()=>listeners.delete(callback);
    },
    setLanguage(next){
      open();
      if(typeof next!=='string'||!Object.prototype.hasOwnProperty.call(explicit,next)){
        throw new RangeError('unsupported locale');
      }
      // Serialize async transitions so rapid menu interaction cannot reorder results.
      chain=chain.catch(()=>{}).then(async()=>{
        if(disposed)return;
        if(instance.language!==next)await instance.changeLanguage(next);
        if(!disposed)for(const callback of [...listeners])callback(instance.language);
      });
      return chain;
    },
    dispose(){
      if(disposed)return;
      disposed=true;listeners.clear();
      // This instance is private to its host; no shared global subscriptions.
      instance.off();
    }
  };
  return Object.freeze(api);
}
