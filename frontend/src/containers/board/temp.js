import React, { FC } from 'react';
import { css } from 'styled-components/macro';
import LineRenderer from './components/lineRenderer';

const styles = {
    root: css`
        z-index: 12;
    `,
};

const Temp = ({ camera, lines }) => (
    <LineRenderer css={styles.main} camera={camera} lines={lines} />
);

export default Temp;
