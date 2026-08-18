import { z } from "zod";

// O SDK de Callable Functions do Firebase serializa campos `undefined` como
// `null` (não os omite, como o JSON.stringify normal faria). Sem isso,
// campos opcionais deixados em branco no formulário chegam como `null` e
// falham na validação de `z.string().optional()` ("expected string,
// received null").
export function optionalString() {
  return z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional(),
  );
}

export function optionalStringArray() {
  return z.preprocess(
    (val) => (val === null ? undefined : val),
    z.array(z.string()).optional(),
  );
}
