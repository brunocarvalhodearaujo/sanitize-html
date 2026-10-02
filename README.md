# sanitize-html

Sanitizador de HTML contra XSS escrito em TypeScript.

Analisa uma string (ou número) HTML, remove tags e atributos perigosos e
reemite apenas o que está na lista permitida. Baseado no modelo de
configuração do [`apostrophecms/sanitize-html`](https://github.com/apostrophecms/sanitize-html).

## Instalação

````bash
npm install @brunocarvalho/sanitize-html
````

## Uso

````ts
import { sanitizeHtml } from '@brunocarvalho/sanitize-html'

// Tags e atributos não permitidos são removidos (modo "discard").
sanitizeHtml('<p>Hello <strong>World</strong><script>alert(1)</script></p>')
// => '<p>Hello <strong>World</strong></p>'

// URL perigosas são removidas; esquemas permitidos por padrão:
// http, https, ftp, mailto, tel.
sanitizeHtml('<a href="javascript:alert(1)">x</a>')
// => '<a>x</a>'
````

`sanitizeHtml` aceita `string | number | null | undefined`. `null`/`undefined`
devolvem `''`.

## Opções

Todas as opções são opcionais e fundidas superficialmente com
`sanitizeHtml.defaults` (`Object.assign`), portanto **não mutar** o objeto de
`defaults` nem as opções fundidas.

| Opção | Descrição |
| --- | --- |
| `allowedTags` | `string[]` de tags permitidas ou `false` para permitir tudo. |
| `allowedAttributes` | Atributos permitidos por tag. Suporta globs (`'*'`) e objetos `{ name, values, multiple }`. |
| `allowedClasses` | Classes permitidas por tag, incluindo globs e `RegExp`. |
| `allowedStyles` | Propriedades CSS permitidas (uso de `style`, via postcss). |
| `disallowedTagsMode` | `'discard'` (padrão), `'escape'`, `'recursiveEscape'` ou `'completelyDiscard'`. |
| `allowedSchemes` | Esquemas de URL permitidos (padrão: `http`, `https`, `ftp`, `mailto`, `tel`). |
| `allowedSchemesByTag` | Esquemas permitidos por tag. |
| `transformTags` | Transforma a tag/atributos (`sanitizeHtml.simpleTransform`). |
| `enforceHtmlBoundary` | Trata múltiplos documentos HTML separados. |

## Transformação de tags

`transformTags` converte uma tag em outra. Use `simpleTransform` para
transformações simples:

```ts
sanitizeHtml('<a href="/x">a</a>', {
  allowedTags: ['b'],
  transformTags: { a: 'b' }
})
// => '<b>a</b>'
```

## Estrutura

```
src/
├── index.ts       # implementação inteira da biblioteca
└── index.spec.ts  # especificações Jest
dist/              # saída do build (index.js + index.d.ts)
```

## Build e testes

- `npm run build` — compila `src/` para `dist/` com `tsc`.
- `npm test` — executa o Jest (configuração inline em `package.json`).

Não há scripts de lint, typecheck, format ou CI. Valide mudanças com
`npm run build && npm test`.

## Licença

ISC
