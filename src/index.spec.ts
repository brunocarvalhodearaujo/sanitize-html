/**
 * Copyright (c) 2026-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { describe, expect, it } from '@jest/globals'
import sanitizeHtml from './index'

describe('basic parsing', () => {
  it('should return an empty string for null', () => {
    expect(sanitizeHtml(null)).toBe('')
  })

  it('should return an empty string for undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('')
  })

  it('should stringify numbers', () => {
    expect(sanitizeHtml(42)).toBe('42')
  })

  it('should stringify numeric strings', () => {
    expect(sanitizeHtml('42')).toBe('42')
  })

  it('should keep allowed tags and drop disallowed ones', () => {
    const input = '<p>Hello <strong>World</strong><script>alert(1)</script></p>'
    expect(sanitizeHtml(input)).toBe('<p>Hello <strong>World</strong></p>')
  })

  it('should remove all HTML tags when allowedTags is empty', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    expect(sanitizeHtml(input, { allowedTags: [] })).toBe('Hello World')
  })

  it('should keep text between allowed tags', () => {
    expect(sanitizeHtml('just text', { allowedTags: [] })).toBe('just text')
  })

  it('should preserve self-closing tags that are allowed', () => {
    expect(sanitizeHtml('<b>bold</b>', { allowedTags: ['b'] })).toBe('<b>bold</b>')
  })

  it('should strip disallowed attributes by default', () => {
    expect(sanitizeHtml('<a href="https://x.com" onclick="alert(1)">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [] } })).toBe('<a>x</a>')
  })
})

describe('disallowedTagsMode', () => {
  it('discard: drops disallowed tags but keeps their text', () => {
    expect(sanitizeHtml('<p>a<b>b</b></p>', { allowedTags: ['p'], disallowedTagsMode: 'discard' })).toBe('<p>ab</p>')
  })

  it('completelyDiscard: drops disallowed tags and their text', () => {
    expect(sanitizeHtml('<p>a<b>b</b></p>', { allowedTags: ['p'], disallowedTagsMode: 'completelyDiscard' })).toBe('<p>a</p>')
  })

  it('escape: escapes disallowed tags and their content', () => {
    expect(sanitizeHtml('<b>x</b>', { allowedTags: [], disallowedTagsMode: 'escape' })).toBe('&lt;b&gt;x&lt;/b&gt;')
  })

  it('recursiveEscape: escapes disallowed tags, preserving allowed nesting', () => {
    expect(sanitizeHtml('<b>x<i>y</i></b>', { allowedTags: ['b'], disallowedTagsMode: 'recursiveEscape' })).toBe('<b>x&lt;i&gt;y&lt;/i&gt;</b>')
  })
})

describe('allowedAttributes', () => {
  it('keeps only allowlisted attributes', () => {
    expect(sanitizeHtml('<a href="https://x.com" title="t">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['href'] } })).toBe('<a href="https://x.com">x</a>')
  })

  it('allows attributes via the wildcard "*", per tag', () => {
    expect(sanitizeHtml('<a href="https://x.com" title="t">x</a>', { allowedTags: ['a'], allowedAttributes: { '*': ['href', 'title'] } })).toBe('<a href="https://x.com" title="t">x</a>')
  })

  it('supports glob patterns for attributes', () => {
    expect(sanitizeHtml('<a data-foo="bar">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['data-*'] } })).toBe('<a data-foo="bar">x</a>')
  })

  it('drops attributes that do not match glob patterns', () => {
    expect(sanitizeHtml('<a data-foo="bar" id="x">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['data-*'] } })).toBe('<a data-foo="bar">x</a>')
  })

  it('supports AllowedAttribute objects with exact values', () => {
    expect(sanitizeHtml('<a href="https://x.com">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [{ name: 'href', values: ['https://x.com'] }] } })).toBe('<a href="https://x.com">x</a>')
  })

  it('drops attribute values not in the allowlist', () => {
    expect(sanitizeHtml('<a href="https://evil.com">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [{ name: 'href', values: ['https://x.com'] }] } })).toBe('<a href>x</a>')
  })

  it('supports AllowedAttribute objects with multiple values', () => {
    expect(sanitizeHtml('<a rel="stylesheet alternate">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [{ name: 'rel', multiple: true, values: ['stylesheet', 'alternate'] }] } })).toBe('<a rel="stylesheet alternate">x</a>')
  })

  it('drops multiple values not in the allowlist', () => {
    expect(sanitizeHtml('<a rel="stylesheet foo">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [{ name: 'rel', multiple: true, values: ['stylesheet', 'alternate'] }] } })).toBe('<a rel="stylesheet">x</a>')
  })

  it('keeps attributes allowed via allowedAttributes when allowedClasses is set', () => {
    expect(sanitizeHtml('<a class="x">y</a>', { allowedTags: ['a'], allowedClasses: { a: ['x'] } })).toBe('<a class="x">y</a>')
  })
})

describe('allowedEmptyAttributes', () => {
  it('renders empty allowed attributes as =" " when value is empty', () => {
    expect(sanitizeHtml('<a alt="">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['alt'] }, allowedEmptyAttributes: ['alt'] })).toBe('<a alt="">x</a>')
  })

  it('drops empty attributes not in allowedEmptyAttributes and not boolean', () => {
    expect(sanitizeHtml('<a placeholder="">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['placeholder'] }, nonBooleanAttributes: ['placeholder'] })).toBe('<a>x</a>')
  })
})

describe('nonBooleanAttributes', () => {
  it('drops empty values of known non-boolean attributes', () => {
    expect(sanitizeHtml('<a disabled="">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['disabled'] }, nonBooleanAttributes: ['disabled'] })).toBe('<a>x</a>')
  })
})

describe('allowedClasses', () => {
  it('filters classes to the allowlist', () => {
    expect(sanitizeHtml('<a class="foo bar baz">x</a>', { allowedTags: ['a'], allowedClasses: { a: ['foo', 'bar'] } })).toBe('<a class="foo bar">x</a>')
  })

  it('supports class glob patterns', () => {
    expect(sanitizeHtml('<a class="foo-bar baz">x</a>', { allowedTags: ['a'], allowedClasses: { a: ['foo-*'] } })).toBe('<a class="foo-bar">x</a>')
  })

  it('drops classes that do not match glob patterns', () => {
    expect(sanitizeHtml('<a class="bar-baz">x</a>', { allowedTags: ['a'], allowedClasses: { a: ['foo-*'] } })).toBe('<a>x</a>')
  })

  it('supports class RegExp patterns', () => {
    expect(sanitizeHtml('<a class="foo-bar baz">x</a>', { allowedTags: ['a'], allowedClasses: { a: [/^foo/] } })).toBe('<a class="foo-bar">x</a>')
  })

  it('supports the "*" wildcard across all tags', () => {
    expect(sanitizeHtml('<span class="foo">x</span>', { allowedTags: ['span'], allowedClasses: { '*': ['foo'] } })).toBe('<span class="foo">x</span>')
  })

  it('merges tag-specific and wildcard classes', () => {
    expect(sanitizeHtml('<a class="foo bar baz">x</a>', { allowedTags: ['a'], allowedClasses: { a: ['foo'], '*': ['bar'] } })).toBe('<a class="foo bar">x</a>')
  })
})

describe('allowedStyles', () => {
  it('filters css properties to the allowlist', () => {
    expect(sanitizeHtml('<span style="color:red;position:fixed">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] }, allowedStyles: { '*': { color: [/red/] } } })).toBe('<span style="color:red">z</span>')
  })

  it('supports tag-specific css property allowlists', () => {
    expect(sanitizeHtml('<span style="color:blue;font-size:12px">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] }, allowedStyles: { span: { color: [/blue/] } } })).toBe('<span style="color:blue">z</span>')
  })

  it('preserves !important', () => {
    expect(sanitizeHtml('<span style="color:red !important">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] }, allowedStyles: { '*': { color: [/red/] } } })).toBe('<span style="color:red !important">z</span>')
  })

  it('drops the style attribute when nothing matches', () => {
    expect(sanitizeHtml('<span style="position:fixed">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] }, allowedStyles: { '*': { color: [/red/] } } })).toBe('<span>z</span>')
  })

  it('throws when allowedStyles is used with parseStyleAttributes: false', () => {
    expect(() => sanitizeHtml('<span style="color:red">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] }, parseStyleAttributes: false, allowedStyles: { '*': { color: [/red/] } } })).toThrow()
  })

  it('drops the style attribute when parsing fails', () => {
    expect(sanitizeHtml('<span style="{invalid">z</span>', { allowedTags: ['span'], allowedAttributes: { span: ['style'] } })).toBe('<span>z</span>')
  })
})

describe('srcset and imagesrcset', () => {
  it('keeps a valid srcset', () => {
    expect(sanitizeHtml('<img srcset="a.png 1x, b.png 2x">', { allowedTags: ['img'], allowedAttributes: { img: ['srcset'] } })).toBe('<img srcset="a.png 1x, b.png 2x">')
  })

  it('filters out evil srcset entries', () => {
    expect(sanitizeHtml('<img srcset="a.png 1x, evil.js 2x">', { allowedTags: ['img'], allowedAttributes: { img: ['srcset'] } })).toBe('<img srcset="a.png 1x">')
  })

  it('drops srcset when all entries are evil', () => {
    expect(sanitizeHtml('<img srcset="evil.js 1x">', { allowedTags: ['img'], allowedAttributes: { img: ['srcset'] } })).toBe('<img>')
  })

  it('drops srcset when unparseable', () => {
    expect(sanitizeHtml('<img srcset="::::">', { allowedTags: ['img'], allowedAttributes: { img: ['srcset'] } })).toBe('<img>')
  })

  it('handles imagesrcset', () => {
    expect(sanitizeHtml('<img imagesrcset="a.png 1x">', { allowedTags: ['img'], allowedAttributes: { img: ['imagesrcset'] } })).toBe('<img imagesrcset="a.png 1x">')
  })
})

describe('URL schemes', () => {
  it('strips javascript: schemes', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>', { allowedTags: ['a'] })).toBe('<a>x</a>')
  })

  it('strips data: schemes', () => {
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>', { allowedTags: ['a'] })).toBe('<a>x</a>')
  })

  it('keeps http and https schemes', () => {
    expect(sanitizeHtml('<a href="https://example.com">x</a>', { allowedTags: ['a'] })).toBe('<a href="https://example.com">x</a>')
  })

  it('keeps ftp, mailto and tel schemes', () => {
    expect(sanitizeHtml('<a href="ftp://x.com">x</a>', { allowedTags: ['a'] })).toBe('<a href="ftp://x.com">x</a>')
    expect(sanitizeHtml('<a href="mailto:a@b.com">x</a>', { allowedTags: ['a'] })).toBe('<a href="mailto:a@b.com">x</a>')
    expect(sanitizeHtml('<a href="tel:+123456">x</a>', { allowedTags: ['a'] })).toBe('<a href="tel:+123456">x</a>')
  })

  it('allows no schemes when allowedSchemes is false', () => {
    expect(sanitizeHtml('<a href="https://example.com">x</a>', { allowedTags: ['a'], allowedSchemes: false })).toBe('<a>x</a>')
  })

  it('supports allowedSchemesByTag per tag', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>', { allowedTags: ['a'], allowedSchemesByTag: { a: ['javascript'] } })).toBe('<a href="javascript:alert(1)">x</a>')
  })

  it('allows protocol-relative urls when allowProtocolRelative is true', () => {
    expect(sanitizeHtml('<a href="//example.com/x">x</a>', { allowedTags: ['a'] })).toBe('<a href="//example.com/x">x</a>')
  })

  it('strips protocol-relative urls when allowProtocolRelative is false', () => {
    expect(sanitizeHtml('<a href="//example.com/x">x</a>', { allowedTags: ['a'], allowProtocolRelative: false })).toBe('<a>x</a>')
  })

  it('applies allowedSchemes to attributes listed in allowedSchemesAppliedToAttributes', () => {
    expect(sanitizeHtml('<img src="javascript:alert(1)">x</img>', { allowedTags: ['img'], allowedAttributes: { img: ['src'] } })).toBe('<img>x')
  })
})

describe('transformTags', () => {
  it('transforms tags via string shorthand', () => {
    expect(sanitizeHtml('<a href="/x">a</a>', { allowedTags: ['b'], transformTags: { a: 'b' } })).toBe('<b>a</b>')
  })

  it('transforms tags via a function', () => {
    expect(sanitizeHtml('<a href="/x">a</a>', { allowedTags: ['b'], transformTags: { a: (name, attribs) => ({ tagName: 'b', attribs }) } })).toBe('<b>a</b>')
  })

  it('transforms all tags with the "*" key', () => {
    expect(sanitizeHtml('<div>hi</div>', { allowedTags: ['div'], transformTags: { '*': 'span' } })).toBe('<span>hi</span>')
  })

  it('applies the "*" transform to nested tags', () => {
    expect(sanitizeHtml('<div><p>x</p></div>', { allowedTags: ['div', 'p'], transformTags: { '*': 'span' } })).toBe('<span><span>x</span></span>')
  })

  it('transforms the closing tag name to match', () => {
    expect(sanitizeHtml('<a href="/x">a</a>', { allowedTags: ['b'], transformTags: { a: 'b' } })).toBe('<b>a</b>')
  })

  it('merges new attributes by default', () => {
    expect(sanitizeHtml('<a href="/x" class="old">a</a>', { allowedTags: ['b'], transformTags: { a: sanitizeHtml.simpleTransform('b', { class: 'new' }) } })).toBe('<b href="/x" class="new">a</b>')
  })

  it('replaces attributes when merge is false', () => {
    expect(sanitizeHtml('<a href="/x" class="old">a</a>', { allowedTags: ['b'], transformTags: { a: sanitizeHtml.simpleTransform('b', { class: 'new' }, false) } })).toBe('<b href="/x" class="new">a</b>')
  })
})

describe('simpleTransform', () => {
  it('returns a transformer merging attributes by default', () => {
    const transform = sanitizeHtml.simpleTransform('b', { class: 'x' })
    expect(sanitizeHtml('<a href="/x" class="old">a</a>', { allowedTags: ['b'], transformTags: { a: transform } })).toBe('<b href="/x" class="x">a</b>')
  })

  it('accepts only a tag name', () => {
    expect(sanitizeHtml('<a href="/x">a</a>', { allowedTags: ['b'], transformTags: { a: sanitizeHtml.simpleTransform('b') } })).toBe('<b href="/x">a</b>')
  })
})

describe('script handling', () => {
  it('drops script content by default', () => {
    expect(sanitizeHtml('<script>alert(1)</script>', { allowedTags: ['script'] })).toBe('')
  })

  it('drops script when not allowed', () => {
    expect(sanitizeHtml('<script>alert(1)</script>', { allowedTags: [] })).toBe('')
  })

  it('drops disallowed script src', () => {
    expect(sanitizeHtml('<script src="https://evil.com/x.js"></script>', { allowedTags: ['script'], allowedAttributes: { script: ['src'] }, allowedScriptDomains: [] })).toBe('<script></script>')
  })

  it('keeps script src when the hostname is allowed', () => {
    expect(sanitizeHtml('<script src="https://cdn.example.com/x.js"></script>', { allowedTags: ['script'], allowedAttributes: { script: ['src'] }, allowedScriptDomains: ['example.com'] })).toBe('<script src="https://cdn.example.com/x.js"></script>')
  })

  it('supports allowedScriptHostnames', () => {
    expect(sanitizeHtml('<script src="https://cdn.example.com/x.js"></script>', { allowedTags: ['script'], allowedAttributes: { script: ['src'] }, allowedScriptHostnames: ['cdn.example.com'] })).toBe('<script src="https://cdn.example.com/x.js"></script>')
  })

  it('supports allowedScriptDomains with subdomains', () => {
    expect(sanitizeHtml('<script src="https://a.b.example.com/x.js"></script>', { allowedTags: ['script'], allowedAttributes: { script: ['src'] }, allowedScriptDomains: ['example.com'] })).toBe('<script src="https://a.b.example.com/x.js"></script>')
  })
})

describe('iframe handling', () => {
  it('keeps allowed iframe src', () => {
    expect(sanitizeHtml('<iframe src="https://example.com/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] } })).toBe('<iframe src="https://example.com/embed"></iframe>')
  })

  it('drops iframe src with disallowed scheme', () => {
    expect(sanitizeHtml('<iframe src="javascript:alert(1)"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] } })).toBe('<iframe></iframe>')
  })

  it('allows relative iframe src by default', () => {
    expect(sanitizeHtml('<iframe src="/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] } })).toBe('<iframe src="/embed"></iframe>')
  })

  it('drops relative iframe src when allowIframeRelativeUrls is false', () => {
    expect(sanitizeHtml('<iframe src="/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] }, allowIframeRelativeUrls: false })).toBe('<iframe></iframe>')
  })

  it('restricts iframe src to allowed hostnames', () => {
    expect(sanitizeHtml('<iframe src="https://other.com/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] }, allowedIframeHostnames: ['example.com'] })).toBe('<iframe></iframe>')
  })

  it('keeps iframe src for allowed hostnames', () => {
    expect(sanitizeHtml('<iframe src="https://example.com/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] }, allowedIframeHostnames: ['example.com'] })).toBe('<iframe src="https://example.com/embed"></iframe>')
  })

  it('restricts iframe src to allowed domains', () => {
    expect(sanitizeHtml('<iframe src="https://sub.example.com/embed"></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: ['src'] }, allowedIframeDomains: ['example.com'] })).toBe('<iframe src="https://sub.example.com/embed"></iframe>')
  })
})

describe('iframe fallback sanitization', () => {
  it('re-sanitizes iframe text content in discard mode', () => {
    expect(sanitizeHtml('<iframe><script>alert(1)</script></iframe>', { allowedTags: ['iframe'], allowedAttributes: { iframe: [] }, disallowedTagsMode: 'discard' })).toBe('<iframe></iframe>')
  })
})

describe('SVG SMIL animation', () => {
  it('drops animate elements animating an href attribute to a javascript URL', () => {
    const input = '<svg><animate attributeName="href" values="#safe;javascript:alert(1)"/></svg>'
    expect(sanitizeHtml(input, { allowedTags: ['svg', 'animate'], allowedAttributes: { svg: [], animate: ['attributeName', 'values'] } })).toBe('<svg></svg>')
  })

  it('keeps animate elements animating non-url attributes', () => {
    const input = '<svg><animate attributeName="opacity" values="0;1"/></svg>'
    expect(sanitizeHtml(input, { allowedTags: ['svg', 'animate'], allowedAttributes: { svg: [], animate: ['attributeName', 'values'] } })).toBe('<svg><animate attributeName="opacity" values="0;1"/></svg>')
  })

  it('matches namespace prefixed xlink:href targets', () => {
    const input = '<svg><animate attributeName="xlink:href" values="#safe;javascript:alert(1)"/></svg>'
    expect(sanitizeHtml(input, { allowedTags: ['svg', 'animate'], allowedAttributes: { svg: [], animate: ['attributeName', 'values'] } })).toBe('<svg></svg>')
  })
})

describe('meta refresh', () => {
  it('drops the content of a meta refresh with a javascript URL', () => {
    expect(sanitizeHtml('<meta http-equiv="refresh" content="0;url=javascript:alert(1)">', { allowedTags: ['meta'], allowedAttributes: { meta: ['http-equiv', 'content'] } })).toBe('<meta http-equiv="refresh">')
  })

  it('keeps the content of a meta refresh with a safe URL', () => {
    expect(sanitizeHtml('<meta http-equiv="refresh" content="0;url=https://example.com">', { allowedTags: ['meta'], allowedAttributes: { meta: ['http-equiv', 'content'] } })).toBe('<meta http-equiv="refresh" content="0;url=https://example.com">')
  })
})

describe('nonTextTags', () => {
  it('drops script content when disallowed', () => {
    expect(sanitizeHtml('<p>before<script>alert(1)</p>', { allowedTags: ['p'], disallowedTagsMode: 'discard' })).toBe('<p>before</p>')
  })

  it('escapes textarea content', () => {
    expect(sanitizeHtml('<textarea>hello</textarea>', { allowedTags: [], disallowedTagsMode: 'discard' })).toBe('<textarea>hello</textarea>')
  })

  it('escapes xmp content', () => {
    expect(sanitizeHtml('<xmp>a &lt; b</xmp>', { allowedTags: [], disallowedTagsMode: 'discard' })).toBe('<xmp>a &lt; b</xmp>')
  })
})

describe('enforceHtmlBoundary', () => {
  it('resets state at each &lt;html&gt; tag', () => {
    expect(sanitizeHtml('<html><p>a</p><p>b</p></html>', { allowedTags: ['p'], enforceHtmlBoundary: true })).toBe('<p>a</p><p>b</p>')
  })
})

describe('selfClosing', () => {
  it('renders self-closing tags without a closing tag', () => {
    expect(sanitizeHtml('<img src="https://x.com/y.png"/>', { allowedTags: ['img'], allowedAttributes: { img: ['src'] }, selfClosing: ['img'] })).toBe('<img src="https://x.com/y.png" />')
  })
})

describe('exclusiveFilter', () => {
  it('removes an entire element when it returns "excludeTag"', () => {
    const filter = (frame: { tag: string }) => frame.tag === 'b' ? 'excludeTag' : true
    expect(sanitizeHtml('<p>a<b>b</b>c</p>', { allowedTags: ['p', 'b'], exclusiveFilter: filter })).toBe('<p>abc</p>')
  })

  it('truncates the result when the filter returns a truthy value', () => {
    const filter = () => false
    expect(sanitizeHtml('<p>a</p>', { allowedTags: ['p'], exclusiveFilter: filter })).toBe('')
  })
})

describe('textFilter', () => {
  it('receives escaped text and can transform it', () => {
    expect(sanitizeHtml('<p>Hello</p>', { allowedTags: ['p'], textFilter: (text) => `***${text}***` })).toBe('<p>***Hello***</p>')
  })
})

describe('onOpenTag and onCloseTag', () => {
  it('invokes onOpenTag with the tag name and attributes', () => {
    const opened: string[] = []
    const options = {
      allowedTags: ['p'],
      onOpenTag: (name: string, attribs: Record<string, string>) => { opened.push(name) }
    }
    sanitizeHtml('<p>Hello</p>', options)
    expect(opened).toEqual(['p'])
  })

  it('invokes onCloseTag with the tag name', () => {
    const closed: string[] = []
    const options = {
      allowedTags: ['p'],
      onCloseTag: (name: string) => { closed.push(name) }
    }
    sanitizeHtml('<p>Hello</p>', options)
    expect(closed).toEqual(['p'])
  })
})

describe('allowVulnerableTags', () => {
  it('warns when a vulnerable tag is in allowedTags', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeHtml('<script>alert(1)</script>', { allowedTags: ['script'], allowVulnerableTags: true })).toBe('<script>alert(1)</script>')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('does not warn when allowVulnerableTags is not set', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    expect(sanitizeHtml('<script>alert(1)</script>', { allowedTags: ['script'] })).toBe('<script>alert(1)</script>')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('namespace prefixes', () => {
  it('checks xlink:href against the scheme allowlist', () => {
    expect(sanitizeHtml('<a xlink:href="javascript:alert(1)">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['xlink:href'] } })).toBe('<a>x</a>')
  })
})

describe('entities and escaping', () => {
  it('escapes angle brackets in text', () => {
    expect(sanitizeHtml('a < b > c', { allowedTags: [] })).toBe('a &lt; b &gt; c')
  })

  it('preserves html entities in text', () => {
    expect(sanitizeHtml('a &amp; b', { allowedTags: [] })).toBe('a &amp; b')
  })

  it('escapes quotes in attribute values', () => {
    expect(sanitizeHtml('<a title="a&quot;b">x</a>', { allowedTags: ['a'], allowedAttributes: { a: ['title'] } })).toBe('<a title="a&amp;quot;b">x</a>')
  })

  it('supports parser.decodeEntities: false', () => {
    expect(sanitizeHtml('a &amp; b', { allowedTags: [], parser: { decodeEntities: false } })).toBe('a &amp; b')
  })
})

describe('exported api', () => {
  it('exposes the default export and the simpleTransform helper', () => {
    expect(typeof sanitizeHtml).toBe('function')
    expect(typeof sanitizeHtml.simpleTransform).toBe('function')
  })
})

describe('options merging', () => {
  it('merges user options over defaults', () => {
    expect(sanitizeHtml('<a href="https://x.com">x</a>', { allowedTags: ['a'], allowedAttributes: { a: [] } })).toBe('<a>x</a>')
  })

  it('does not mutate the exported defaults', () => {
    const originalAllowedTags = sanitizeHtml.defaults.allowedTags
    expect(sanitizeHtml('<a href="https://x.com">x</a>', { allowedTags: ['a'] })).toBe('<a>x</a>')
    expect(sanitizeHtml.defaults.allowedTags).toBe(originalAllowedTags)
  })
})
