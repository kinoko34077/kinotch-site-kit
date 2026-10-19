export interface Localization {
  readonly language:string;
  available():string[];
  direction():'ltr'|'rtl';
  t(key:string, options?:Record<string,unknown>):string;
  formatNumber(value:number, options?:Intl.NumberFormatOptions):string;
  formatDate(value:Date|number|string, options?:Intl.DateTimeFormatOptions):string;
  subscribe(callback:(language:string)=>void):()=>void;
  setLanguage(language:string):Promise<void>;
  dispose():void;
}
export function createLocalization(options:{
  resources:Record<string,Record<string,string>>;
  language?:string;fallbackLanguage?:string;
}):Promise<Localization>;
