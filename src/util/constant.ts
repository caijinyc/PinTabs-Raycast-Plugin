export const DefaultBrowser = {
  Chrome: 'chrome',
  Edge: 'edge',
} as const;


export const BrowserMapApplication = {
  [DefaultBrowser.Chrome]: 'com.google.Chrome',
  [DefaultBrowser.Edge]: 'com.microsoft.edgemac',
} as const;