import './zone-flags';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */

import 'zone.js/dist/zone';  // Included with Angular CLI.

// Used for browsers with partially native support of Custom Elements
import '@webcomponents/custom-elements/src/native-shim';

// Used for browsers without a native support of Custom Elements
import '@webcomponents/custom-elements/custom-elements.min';
/***************************************************************************************************
 * APPLICATION IMPORTS
 */
import 'intersection-observer';
import '@ungap/global-this';

window['global'] = globalThis as any;
window['process'] = window['process'] || require('process/browser');
window['Buffer'] = window['Buffer'] || require('buffer').Buffer;
