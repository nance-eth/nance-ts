import {
  Translator,
  TargetLanguageCode
} from 'deepl-node';

export class DeeplHandler {
  private translator;

  constructor(
    private deeplKey: string
  ) {
    this.translator = new Translator(deeplKey);
  }

  async translate(originalText: string, targetLanuage: TargetLanguageCode): Promise<string> {
    return this.translator.translateText(originalText, null, targetLanuage).then((response) => {
      return response.text;
    }).catch((e) => {
      return e;
    });
  }
}
