import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
// import {getLocales} from 'react-native-localize';

import de_T from '../assets/locales/de.json';
import en_T from '../assets/locales/en.json';
import es_T from '../assets/locales/es.json';
import it_T from '../assets/locales/it.json';
import pl_T from '../assets/locales/pl.json';
import ru_T from '../assets/locales/ru.json';
import fr_T from '../assets/locales/fr.json';
import hi_T from '../assets/locales/hi.json';
import id_T from '../assets/locales/id.json';
import sq_T from '../assets/locales/sq.json';
import zh_T from '../assets/locales/zh.json';
import tl_T from '../assets/locales/tl.json';
import ta_T from '../assets/locales/ta.json';

function initI18N(languageCode: string) {
  i18n.use(initReactI18next).init({
    lng: languageCode,
    //   lng: getLocales()[0].languageCode,
    fallbackLng: 'en',
    resources: {
      de: de_T,
      en: en_T,
      es: es_T,
      it: it_T,
      pl: pl_T,
      ru: ru_T,
      fr: fr_T,
      hi: hi_T,
      id: id_T,
      sq: sq_T,
      zh: zh_T,
      tl: tl_T,
      ta: ta_T,
    },
  });
}

export default initI18N;
