class TextExtraction {
  /**
   * @param {String} text - Text to be parsed
   * @param {Object[]} patterns - Patterns to be used when parsed
   *                              other options than pattern would be added to the parsed content
   * @param {RegExp} patterns[].pattern - RegExp to be used for parsing
   */
  constructor(text, patterns) {
    this.text     = text;
    this.patterns = patterns || [];
  }

  /**
   * Returns tokenized text and map of tokens
   * @return {Object{text: String, tokens: {}}} - tokenized string and tokens object
   */
  parse() {
    const tokens = {};
    let text = this.text;

    let count = 0;

    this.patterns.forEach((pattern, patternIndex) => {
      const patternRegex = new RegExp(pattern.pattern, 'gm');

      const replace = (...matches) => {
        const tokenName = `TOKEN-${patternIndex}-${count}`;
        const tokenProps = {};
        const matched = matches[0];
        const tokenText = pattern.renderText && typeof pattern.renderText === 'function' ? pattern.renderText(matched, matches) : matched;
        Object.keys(pattern).forEach((key) => {
          if (key === 'pattern' || key === 'renderText') { return; }

          if (typeof pattern[key] === 'function') {
            tokenProps[key] = () => pattern[key](tokenText, patternIndex);
          } else {
            tokenProps[key] = pattern[key];
          }
        });

        tokens[tokenName] = {
          text: tokenText,
          props: tokenProps,
        };

        count += 1;
        return `{{${tokenName}}}`;
      };

      Object.values(tokens).forEach((token) => {
        token.text = token.text.replace(patternRegex, replace);
      });

      text = text.replace(patternRegex, replace);
    });
    return {text, tokens};
  }
}

export default TextExtraction;
