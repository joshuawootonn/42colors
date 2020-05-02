import React from 'react';
import styled, { css, keyframes } from 'styled-components/macro';
import useLines from '../../context/line.context';
import { connectionSet, ConnectionType } from '../../models/connection';
import wiggle from '../../assets/keyframes/wiggle';

const aaa = keyframes`

`;
const styles = {
    root: css`
        top: 16px;
        right: 16px;
        position: absolute;
        display: flex;
        flex-direction: column;
        z-index: 25;
    `,
    connected: css`
        color: #8cf28c;
    `,
    neverConnected: css`
        color: black;
    `,
    disConnected: css`
        animation: 400ms ${wiggle} ease infinite;
        color: #ef3f3f;
    `,
};

export const ConnectionContainer: React.FC = () => {
    const { connectionState } = useLines();
    return (
        <div css={styles.root}>
            <p css={styles[connectionState.type]}>{connectionSet[connectionState.type].message}</p>
        </div>
    );
};

export default ConnectionContainer;
