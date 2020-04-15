import React from 'react';
import { css } from 'styled-components/macro';

const styles = {
    root: css`
        border: none;
        border-radius: 12px;
        padding: 8px;
        background-color: white;
        text-align: center;
        width: 95px;
        user-select: none;
    `,
};

const Text = ({ children, ...props }) => (
    <span css={styles.root} {...props}>
        {children}
    </span>
);

export default Text;
