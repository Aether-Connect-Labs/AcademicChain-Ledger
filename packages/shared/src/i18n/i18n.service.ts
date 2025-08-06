import { injectable } from 'inversify';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

@injectable()
export class I18nService {
  constructor() {
    i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: {
            translation: {
              "credential.issued": "Credential issued successfully",
              "credential.revoked": "Credential has been revoked",
              // Más traducciones...
            }
          },
          es: {
            translation: {
              "credential.issued": "Credencial emitida con éxito",
              "credential.revoked": "La credencial ha sido revocada",
              // Más traducciones...
            }
          }
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        }
      });
  }

  t(key: string, options?: any): string {
    return i18n.t(key, options);
  }

  changeLanguage(lang: string): Promise<void> {
    return i18n.changeLanguage(lang);
  }
}