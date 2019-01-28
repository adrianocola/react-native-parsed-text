import React from 'react';
import ReactNative from 'react-native';
import PropTypes from 'prop-types';

import TextExtraction from './lib/TextExtraction';

export const PATTERNS = {
  url: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/i,
  phone: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,7}/,
  email: /\S+@\S+\.\S+/,
};

const defaultParseShape = PropTypes.shape({
  ...ReactNative.Text.propTypes,
  type: PropTypes.oneOf(Object.keys(PATTERNS)).isRequired,
});

const customParseShape = PropTypes.shape({
  ...ReactNative.Text.propTypes,
  pattern: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(RegExp)]).isRequired,
});

class ParsedText extends React.Component {

  static displayName = 'ParsedText';

  static propTypes = {
    ...ReactNative.Text.propTypes,
    parse: PropTypes.arrayOf(
      PropTypes.oneOfType([defaultParseShape, customParseShape]),
    ),
    childrenProps: PropTypes.shape(ReactNative.Text.propTypes),
  };

  static defaultProps = {
    parse: null,
    childrenProps: {},
  };

  setNativeProps(nativeProps) {
    this._root.setNativeProps(nativeProps);
  }

  getPatterns() {
    return this.props.parse.map((option) => {
      const {type, ...patternOption} = option;
      if (type) {
        if (!PATTERNS[type]) {
          throw new Error(`${option.type} is not a supported type`);
        }
        patternOption.pattern = PATTERNS[type];
      }

      return patternOption;
    });
  }

  generateComponent(tokens, token, tokenName) {
    let count = 0;
    let text = token.text;
    const components = [];
    let match;
    do{
      match = text.match(/\{\{(TOKEN\-[0-9]+\-[0-9]+)\}\}/);
      if(match){
        let textBefore = text.substr(0, match.index);
        if(textBefore){
          components.push(<ReactNative.Text {...this.props.childrenProps} {...token.props} key={count++}>{textBefore}</ReactNative.Text>);
        }
        const subTokenName = match[1];
        const subToken = tokens[subTokenName];
        components.push(this.generateComponent(tokens, subToken, subTokenName));
        text = text.substr(match.index + match[0].length);
      }else if(text){
        components.push(<ReactNative.Text {...this.props.childrenProps} {...token.props} key={count++}>{text}</ReactNative.Text>);
      }
    }while(match);

    return <ReactNative.Text {...this.props.childrenProps} {...token.props} key={tokenName}>{components}</ReactNative.Text>
  }

  getParsedText() {
    if (!this.props.parse)                       { return this.props.children; }
    if (typeof this.props.children !== 'string') { return this.props.children; }

    const textExtraction = new TextExtraction(this.props.children, this.getPatterns());

    const token = textExtraction.parse();
    return (
      <ReactNative.Text
        {...this.props.childrenProps}
      >
        {this.generateComponent(token.tokens, token, 'token')}
      </ReactNative.Text>
    );
  }

  render() {
    return (
      <ReactNative.Text
        ref={ref => this._root = ref}
        {...this.props}
      >
        {this.getParsedText()}
      </ReactNative.Text>
    );
  }

}

export default ParsedText;
