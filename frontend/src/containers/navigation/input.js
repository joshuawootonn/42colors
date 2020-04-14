import React from 'react';
import { css } from 'styled-components/macro';
import { inputAnimationTag } from './animations';

const styles = {
    root: css`
        width: 65px;
        border: none;
        border-radius: 12px;
        padding: 8px;
    `,
};

const Input = ({ value, onChange, name, ...props }) => (
    <input
        data-animate={inputAnimationTag}
        css={styles.root}
        name={name}
        type="number"
        min="-1000000"
        max="1000000"
        step={100}
        value={value}
        onChange={onChange}
        {...props}
    />
);

export default Input;
