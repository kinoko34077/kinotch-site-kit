import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./static-tests',
  timeout:45000,
  use:{baseURL:'http://127.0.0.1:4183/probe/',viewport:{width:390,height:844},
    screenshot:'only-on-failure'},
  webServer:{command:'node ../../packages/runtime/scripts/serve-static-fixture.mjs',
    url:'http://127.0.0.1:4183/probe/',reuseExistingServer:false,timeout:45000},
  projects:[
    {name:'chromium',use:{browserName:'chromium'}},
    {name:'webkit',use:{browserName:'webkit'}}
  ],
  reporter:'list'
});
