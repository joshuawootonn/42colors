import styled from 'styled-components';

export const EdgeRoot = styled.div<{ isPanning: boolean }>`
    position: absolute;
    transition: all ease 300ms;
    display: flex;
    flex-direction: column;
    z-index: 15;
`;
