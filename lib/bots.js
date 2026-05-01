const BOT_UA_RE = /(facebookexternalhit|meta-external|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|petalbot|amazonbot|claudebot|gptbot|ccbot|chatgpt-user|perplexitybot|imagesiftbot|ai2bot|mj12bot|semrushbot|ahrefsbot|dotbot|seekport|qwantify|pingdom|uptimerobot|datadogagent|telegrambot|whatsapp|discordbot|slackbot|twitterbot|linkedinbot|embedly|sogou|bytespider|facebot)/i;

const BOT_BAIT_PATHS = [
  /^\/meta\.json/i,
  /^\/wp[-/]/i,
  /^\/wordpress/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.aws/i,
  /^\/\.svn/i,
  /^\/\.htaccess/i,
  /^\/phpmyadmin/i,
  /^\/admin($|\/)/i,
  /^\/HNAP1/i,
  /^\/cgi-bin/i,
  /^\/owa\//i,
  /^\/autodiscover/i,
  /^\/api\.php/i,
  /^\/xmlrpc\.php/i,
  /^\/setup\.php/i,
  /^\/install\.php/i,
  /^\/.+\.(asp|aspx|jsp|cgi)$/i,
];

function isBotUA(ua) {
  return !!ua && BOT_UA_RE.test(ua);
}

function isBaitPath(p) {
  if (!p) return false;
  return BOT_BAIT_PATHS.some((re) => re.test(p));
}

function botLabel(ua) {
  if (!ua) return 'bot';
  const u = ua.toLowerCase();
  if (u.includes('facebookexternalhit') || u.includes('meta-external') || u.includes('facebot')) return 'fb';
  if (u.includes('googlebot')) return 'gg';
  if (u.includes('bingbot')) return 'bg';
  if (u.includes('twitterbot')) return 'tw';
  if (u.includes('applebot')) return 'ap';
  if (u.includes('linkedinbot')) return 'li';
  if (u.includes('whatsapp')) return 'wa';
  if (u.includes('telegrambot')) return 'tg';
  if (u.includes('discordbot')) return 'dc';
  if (u.includes('slackbot')) return 'sk';
  if (u.includes('gptbot') || u.includes('chatgpt-user')) return 'gpt';
  if (u.includes('claudebot')) return 'cld';
  if (u.includes('perplexitybot')) return 'plx';
  return 'bot';
}

module.exports = { isBotUA, isBaitPath, botLabel };
