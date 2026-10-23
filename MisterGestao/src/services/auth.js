import { getAuth } from 'firebase/auth';

import { app } from './firebase';

// Na web, o Firebase gerencia a persistência no navegador.
export const auth = getAuth(app);
