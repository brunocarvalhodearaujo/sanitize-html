/**
 * Copyright (c) 2026-present, Bruno Carvalho de Araujo.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import { describe, expect, it } from '@jest/globals'
import { sanitizeHtml } from './index'

describe('sanitizeHtml', () => {
  it('should keep allowed tags and drop disallowed ones', () => {
    const input = '<p>Hello <strong>World</strong><script>alert(1)</script></p>'
    expect(sanitizeHtml(input)).toBe('<p>Hello <strong>World</strong></p>')
  })

  it('should remove all HTML tags when allowedTags is empty', () => {
    const input = '<p>Hello <strong>World</strong></p>'
    expect(sanitizeHtml(input, { allowedTags: [] })).toBe('Hello World')
  })

  it('should return an empty string for null and undefined', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
  })

  it('should accept numbers', () => {
    expect(sanitizeHtml(42)).toBe('42')
  })

  it('should strip disallowed URL schemes', () => {
    const input = '<a href="javascript:alert(1)">x</a><a href="https://example.com">y</a>'
    expect(sanitizeHtml(input)).toBe('<a>x</a><a href="https://example.com">y</a>')
  })

  it('should apply transformTags', () => {
    expect(sanitizeHtml('<a href="/x">a</a>', {
      allowedTags: ['b'],
      transformTags: { a: 'b' }
    })).toBe('<b>a</b>')
  })

  it('should escape disallowed tags in escape mode', () => {
    expect(sanitizeHtml('<b>x</b><i>y</i>', {
      allowedTags: ['b'],
      disallowedTagsMode: 'escape'
    })).toBe('<b>x</b>&lt;i&gt;y&lt;/i&gt;')
  })

  it('should filter inline styles', () => {
    expect(sanitizeHtml('<span style="color:red;position:fixed">z</span>', {
      allowedTags: ['span'],
      allowedAttributes: { span: ['style'] },
      allowedStyles: { '*': { color: [/red/] } }
    })).toBe('<span style="color:red">z</span>')
  })
})
