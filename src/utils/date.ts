import {store} from '../store';

const todayTranslations = {
  'en-US': 'Today',
  'es-ES': 'Hoy',
  'fr-FR': "Aujourd'hui",
  'de-DE': 'Heute',
  'zh-CN': '今天',
  'it-IT': 'Oggi',
  'ru-RU': 'Cегодня',
  'pl-PL': 'Dzisiaj',
  'sq-AL': 'Sot',
  'id-ID': 'Hari ini',
  'hi-IN': 'आज',
  'tl-PH': 'Ngayon',
};

export const formatDate = (date: number) => {
  const state = store.getState();
  const {languageTag} = state.settings;
  const ONE_DAY = 60 * 60 * 24 * 1000;
  const jsDate = new Date(date);
  const time = new Date();
  const diff = time - jsDate;

  if (diff < ONE_DAY) {
    return todayTranslations[languageTag] || 'Today';
  }

  if (diff > ONE_DAY && jsDate.getFullYear() === time.getFullYear()) {
    return jsDate.toLocaleDateString(languageTag, {
      month: 'long',
      day: 'numeric',
    });
  }

  return jsDate.toLocaleDateString(languageTag, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (time: number) => {
  const state = store.getState();
  const {languageTag} = state.settings;
  const jsTime = new Date(time);
  return jsTime.toLocaleTimeString(languageTag, {
    hour: 'numeric',
    minute: 'numeric',
  });
};

export const formatMonths = (date: number) => {
  const state = store.getState();
  const {languageTag} = state.settings;
  const jsDate = new Date(date);
  const time = new Date();

  if (jsDate.getFullYear() === time.getFullYear()) {
    return jsDate.toLocaleDateString(languageTag, {month: 'long'});
  }

  return jsDate.toLocaleDateString(languageTag, {
    month: 'long',
    year: 'numeric',
  });
};

export const formatTxDate = (timestampInSec: number) => {
  const state = store.getState();
  const {languageTag} = state.settings;
  const jsDate = new Date(timestampInSec * 1000);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const year = jsDate.getFullYear();
  const month = months[jsDate.getMonth()];
  const date = jsDate.getDate();

  const time = jsDate.toLocaleString(languageTag, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const dateString = date + ' ' + month + ' ' + year + ', ' + time;

  return dateString;
};
