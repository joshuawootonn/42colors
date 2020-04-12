import { keyframes } from 'styled-components/macro';

export const wiggle = keyframes`
    0% {
        transform: scale(1.05) 
    }
    50% {
        transform: scale(1) 
    }
    100% {
        transform: scale(1.05) 
    }
`;
export default wiggle;
