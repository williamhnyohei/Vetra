// Helper para obter informações da extensão
export const getExtensionInfo = () => {
  return {
    id: chrome.runtime.id,
    url: chrome.runtime.getURL(''),
    manifest: chrome.runtime.getManifest()
  };
};

// Log extension info for debugging
export const logExtensionInfo = () => {
  const info = getExtensionInfo();
  console.log('🔍 Extension Info:', {
    id: info.id,
    url: info.url,
    name: info.manifest.name,
    version: info.manifest.version
  });
  return info;
};
