import {test,expect} from '@playwright/test';

// This is a cold *browser-lab* request inventory for the deployed Pages fixture.
// Measure each route independently in a fresh isolated Playwright browser context.
// Do not call these values production Core Web Vitals or real iPhone metrics.
for (const route of [
  {name:'vanilla',path:'./',ready:'#locale-message'},
  {name:'react',path:'./react.html',ready:'#react-locale-message'}
]) {
  test('cold public route request inventory: '+route.name,async({page},testInfo)=>{
    test.skip(!process.env.M0_BASE_URL,'Only a built, actually deployed public static route can be measured');
    const finished=[];
    const failed=[];
    page.on('requestfinished',request=>finished.push(request));
    page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()}));
    const start=Date.now();
    const response=await page.goto(route.path,{waitUntil:'load'});
    expect(response?.status()).toBe(200);
    await expect(page.locator(route.ready)).toHaveText('未読み込み');
    await page.evaluate(async()=>{await document.fonts.ready;});
    // The deployed static site has no polling. This accounts for deferred static
    // module fetches, not for future user-triggered dynamic import.
    await page.waitForLoadState('networkidle');
    const elapsed=Date.now()-start;
    const rows=[];
    for(const request of finished){
      const response=await request.response();
      if(!response)continue;
      const url=new URL(request.url());
      const sizes=await request.sizes();
      rows.push({
        path:url.pathname,origin:url.origin,
        resourceType:request.resourceType(),
        status:response.status(),
        decodedResponseBodyBytes:sizes.responseBodySize,
        responseHeaderBytes:sizes.responseHeadersSize,
        encodedRequestBodyBytes:sizes.requestBodySize,
        fromServiceWorker:response.fromServiceWorker()
      });
    }
    const staticAssets=rows.filter(x=>['script','stylesheet','font'].includes(x.resourceType));
    const selected=type=>staticAssets.filter(x=>x.resourceType===type);
    const total=rs=>rs.reduce((sum,row)=>sum+row.decodedResponseBodyBytes+row.responseHeaderBytes,0);
    const summary={
      route:route.name,source:'real GitHub Pages cold Playwright desktop browser',
      browser:testInfo.project.name,elapsedLoadAndNetworkIdleMs:elapsed,
      note:'response sizes are Playwright-observed sizes, not TLS/wire actual user bytes; local cache/remote server encoding may vary',
      count:rows.length,scriptRequests:selected('script').length,
      stylesheetRequests:selected('stylesheet').length,fontRequests:selected('font').length,
      responseBodyPlusHeaderBytes:total(rows),
      startupScriptPlusCssBytes:total([...selected('script'),...selected('stylesheet')]),
      externalOrigins:[...new Set(rows.filter(x=>x.origin!==new URL(page.url()).origin).map(x=>x.origin))],
      failed,requests:rows
    };
    const scriptPaths=selected('script').map(x=>x.path);
    expect(scriptPaths.filter(p=>/(i18next|i18n-[a-z0-9]+\.js|\/features\/i18n\.mjs)/i.test(p))).toEqual([]);
    if(route.name==='vanilla'){
      expect(scriptPaths.filter(p=>/\/react-[^/]+\.js$/i.test(p))).toEqual([]);
    }
    expect(failed).toEqual([]);
    expect(rows.some(x=>x.resourceType==='stylesheet')).toBe(true);
    expect(rows.some(x=>x.resourceType==='script')).toBe(true);
    expect(summary.externalOrigins).toEqual([]);
    console.log('SITE_KIT_COLD_ROUTE',JSON.stringify({
      browser:summary.browser,route:summary.route,
      requests:summary.count,scriptRequests:summary.scriptRequests,
      stylesheetRequests:summary.stylesheetRequests,
      bytes:summary.responseBodyPlusHeaderBytes,
      startupScriptCssBytes:summary.startupScriptPlusCssBytes,
      externallyRequestedOrigins:summary.externalOrigins.length
    }));
    await testInfo.attach('cold-route-'+route.name+'-'+testInfo.project.name,{
      body:Buffer.from(JSON.stringify(summary,null,2)+'\n'),contentType:'application/json'
    });
  });
}
