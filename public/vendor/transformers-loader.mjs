import * as Transformers from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js";

globalThis.__BESANJ_TRANSFORMERS__ = Transformers;
globalThis.dispatchEvent(new Event("besanj-transformers-ready"));
