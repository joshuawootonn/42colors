/// <reference types="react-scripts" />
declare module 'react-use';
declare module 'catenary-curve';

import { CSSProp } from 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        // Your theme stuff here
    }
}

declare module 'react' {
    interface Attributes {
        css?: CSSProp;
    }
}
