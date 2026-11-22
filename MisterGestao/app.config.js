const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

module.exports = ({ config, projectRoot }) => {
  const arquivoLocal = resolve(projectRoot, 'google-services.json');
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON
    || config.android?.googleServicesFile
    || (existsSync(arquivoLocal) ? arquivoLocal : undefined);

  // Checkouts sem as imagens da marca usam os recursos padrão do Expo.
  function imagem(caminho) {
    if (typeof caminho !== 'string') return caminho;
    return /^https?:\/\//.test(caminho) || (caminho && existsSync(resolve(projectRoot, caminho))) ? caminho : undefined;
  }
  const adaptiveIcon = config.android?.adaptiveIcon;
  return {
    ...config,
    icon: imagem(config.icon),
    ios: { ...config.ios, icon: imagem(config.ios?.icon) },
    android: {
      ...config.android,
      googleServicesFile,
      adaptiveIcon: adaptiveIcon && {
        ...adaptiveIcon,
        foregroundImage: imagem(adaptiveIcon.foregroundImage),
        backgroundImage: imagem(adaptiveIcon.backgroundImage),
        monochromeImage: imagem(adaptiveIcon.monochromeImage),
      },
    },
    web: { ...config.web, favicon: imagem(config.web?.favicon) },
    plugins: config.plugins?.map((plugin) => (
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
        ? [plugin[0], { ...plugin[1], image: imagem(plugin[1]?.image) }]
        : plugin
    )),
  };
};
