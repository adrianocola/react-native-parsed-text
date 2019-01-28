import 'jest';
import 'react-native';

import { PATTERNS } from '../src/ParsedText';
import TextExtraction from '../src/lib/TextExtraction';

describe('TextExtraction', () => {
  describe('#parse', () => {
    it('returns an array with the text if there is no patterns', () => {
      const textExtraction = new TextExtraction('Some Text');

      expect(textExtraction.parse()).toEqual({ text: 'Some Text', tokens: {} });
    });

    it('returns an array with the text if the text cant be parsed', () => {
      const textExtraction = new TextExtraction('Some Text', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).toEqual({ text: 'Some Text', tokens: {} });
    });

    it('returns an array with the text and return only present values', () => {
      const textExtraction = new TextExtraction('abcdef', [
        { pattern: /abcdef/ },
      ]);

      expect(textExtraction.parse()).toEqual({"text": "{{TOKEN-0-0}}", "tokens": {"TOKEN-0-0": {"props": {}, "text": "abcdef"}}});
    });

    it('returns an array with text parts if there is matches', () => {
      const textExtraction = new TextExtraction(
        'hello my website is http://foo.bar, bar is good.',
        [{ pattern: /bar/ }],
      );

      expect(textExtraction.parse()).toEqual({"text": "hello my website is http://foo.{{TOKEN-0-0}}, {{TOKEN-0-1}} is good.", "tokens": {"TOKEN-0-0": {"props": {}, "text": "bar"}, "TOKEN-0-1": {"props": {}, "text": "bar"}}});
    });

    it('return all matched urls', () => {
      const urls = [
        'https://website.bz',
        'http://website2.it',
        'https://t.co/hashKey',
      ];
      const textExtraction = new TextExtraction(
        `this is my website ${urls[0]} and this is also ${
          urls[1]
          } and why not this one also ${urls[2]}`,
        [
          {
            pattern: PATTERNS.url,
          },
        ],
      );

      expect(textExtraction.parse()).toEqual({"text": "this is my website {{TOKEN-0-0}} and this is also {{TOKEN-0-1}} and why not this one also https://t.co/hashKey", "tokens": {"TOKEN-0-0": {"props": {}, "text": "https://website.bz"}, "TOKEN-0-1": {"props": {}, "text": "http://website2.it"}}});
    });

    it('does not include trailing dots or unexpected punctuation', () => {
      const urls = [
        'https://website.bz',
        'http://website2.it',
        'https://t.co/hashKey',
      ];
      const textExtraction = new TextExtraction(
        `URLS: ${urls[0]}. ${urls[1]}, ${urls[2]}!`,
        [
          {
            pattern: PATTERNS.url,
          },
        ],
      );

      expect(textExtraction.parse()).toEqual({"text": "URLS: {{TOKEN-0-0}} {{TOKEN-0-1}}, https://t.co/hashKey!", "tokens": {"TOKEN-0-0": {"props": {}, "text": "https://website.bz."}, "TOKEN-0-1": {"props": {}, "text": "http://website2.it"}}});
    });

    it('pass the values to the callbacks', done => {
      const textExtraction = new TextExtraction('hello foo', [
        {
          pattern: /foo/,
          onPress: value => {
            expect(value).toEqual('foo');
            done();
          },
        },
      ]);

      const parsed = textExtraction.parse();
      expect(parsed.text).toEqual('hello {{TOKEN-0-0}}');
      expect(parsed.tokens['TOKEN-0-0'].props.onPress).toBeInstanceOf(Function);

      parsed.tokens['TOKEN-0-0'].props.onPress(parsed.tokens['TOKEN-0-0'].text);
    });

    it('respects the parsing order', () => {
      const textExtraction = new TextExtraction(
        'hello my website is http://foo.bar, bar is good.',
        [
          { pattern: /bar/ },
          {
            pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
          },
        ],
      );

      expect(textExtraction.parse()).toEqual({"text": "hello my website is http://foo.{{TOKEN-0-0}}, {{TOKEN-0-1}} is good.", "tokens": {"TOKEN-0-0": {"props": {}, "text": "bar"}, "TOKEN-0-1": {"props": {}, "text": "bar"}}});
    });
  });

  describe('renderText prop', () => {
    it('checks that renderText is a function', () => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        { pattern: /\[(@[^:]+):([^\]]+)\]/i, renderText: 'foo' },
      ]);

      expect(textExtraction.parse()).toEqual({"text": "Mention {{TOKEN-0-0}}", "tokens": {"TOKEN-0-0": {"props": {}, "text": "[@michel:561316513]"}}});
    });
    it('pass the values to the callbacks', () => {
      const textExtraction = new TextExtraction('Mention [@michel:561316513]', [
        {
          pattern: /\[(@[^:]+):([^\]]+)\]/i,
          renderText: (string, matches) => {
            let pattern = /\[(@[^:]+):([^\]]+)\]/i;
            let match = string.match(pattern);
            expect(matches[0]).toEqual('[@michel:561316513]');
            expect(matches[1]).toEqual('@michel');
            expect(matches[2]).toEqual('561316513');
            return `^^${match[1]}^^`;
          },
        },
      ]);

      expect(textExtraction.parse()).toEqual({"text": "Mention {{TOKEN-0-0}}", "tokens": {"TOKEN-0-0": {"props": {}, "text": "^^@michel^^"}}});
    });
  });
});
