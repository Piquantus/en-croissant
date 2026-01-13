import { pipeline } from '@huggingface/transformers';
import fs from 'fs';

// Charge le modèle local
const commentaryPipeline = await pipeline('text-generation', 'NAKSTStudio/chess-gemma-commentary', {
  model_kwargs: { torch_dtype: 'auto' } // adapte la précision selon ton GPU/CPU
});
