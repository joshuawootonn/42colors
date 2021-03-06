import React from 'react';
import { css } from 'styled-components/macro';
import ColorInput from './color';
import SizeInput from './size';

const styles = {
    root: css`
        position: absolute;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        z-index: 15;
        right: 16px;
        bottom: 16px;
        span,
        a {
            margin-right: 16px;
        }
    `,
    row: css`
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex-direction: row;
        width: min-content;

        border-radius: 24px;
        background-color: rgba(240, 240, 240, 0.7);

        margin-bottom: 16px;

        &:last-child {
            margin-bottom: 0;
        }
    `,
    text: css`
        margin-top: 0;
        margin-bottom: 0.5em;
    `,
};

export const Control = ({ canvasSettings, setCanvasSettings }) => (
    <div css={styles.root}>
        <div css={styles.row}>
            <SizeInput
                color={canvasSettings.brushColor}
                value={canvasSettings.brushWidth}
                onChange={event =>
                    setCanvasSettings({
                        ...canvasSettings,
                        brushWidth: parseInt(event.target.value),
                    })
                }
            />
        </div>
        <div css={styles.row}>
            <ColorInput
                value={canvasSettings.brushColor}
                onChange={event =>
                    setCanvasSettings({ ...canvasSettings, brushColor: event.target.value })
                }
            />
        </div>
    </div>
);

export default Control;
