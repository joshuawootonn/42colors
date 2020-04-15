import React from 'react';
import { css } from 'styled-components/macro';
import Text from './text';

const styles = {
    root: css`
        top: 16px;
        left: 16px;
        position: absolute;
        display: flex;
        flex-direction: column;
        z-index: 15;

        padding: 16px;
        border-radius: 24px;
        background-color: rgba(240, 240, 240, 0.7);

        span,
        a {
            margin-right: 16px;
        }

        div {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-bottom: 16px;
            & > * {
                margin-right: 8px;
                &:last-child {
                    margin-right: 0;
                }
            }
            &:last-child {
                margin-bottom: 0;
            }
        }
    `,
    root2: css`
        position: relative;
    `,
};
export const Navigation = ({ currentMapPosition }) => (
    <div css={styles.root}>
        <div css={styles.root2}>
            <Text>x: {currentMapPosition.x}</Text>
        </div>
        <div css={styles.root2}>
            <Text>y: {currentMapPosition.y}</Text>
        </div>
    </div>
);

export default Navigation;
