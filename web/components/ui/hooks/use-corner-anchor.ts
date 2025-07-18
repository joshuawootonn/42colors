import { useCallback, useEffect, useState } from 'react';

interface UseCornerAnchorOptions {
    isEnabled?: boolean;
    position: { x: number; y: number };
    elementRef: React.RefObject<HTMLElement | null>;
    margin?: number;
}

interface UseCornerAnchorReturn {
    anchoredPosition: { x: number; y: number };
    currentCorner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function useCornerAnchor({
    isEnabled = true,
    position,
    elementRef,
    margin = 20,
}: UseCornerAnchorOptions): UseCornerAnchorReturn {
    const [anchoredPosition, setAnchoredPosition] = useState(position);
    const [currentCorner, setCurrentCorner] = useState<Corner>('top-left');
    const [cornerOffset, setCornerOffset] = useState({ x: 0, y: 0 });

    const calculateClosestCorner = useCallback(
        (
            pos: { x: number; y: number },
            windowWidth: number,
            windowHeight: number,
        ): Corner => {
            const centerX = windowWidth / 2;
            const centerY = windowHeight / 2;

            const isLeft = pos.x < centerX;
            const isTop = pos.y < centerY;

            if (isTop && isLeft) return 'top-left';
            if (isTop && !isLeft) return 'top-right';
            if (!isTop && isLeft) return 'bottom-left';
            return 'bottom-right';
        },
        [],
    );

    const calculateOffsetFromCorner = useCallback(
        (
            pos: { x: number; y: number },
            corner: Corner,
            windowWidth: number,
            windowHeight: number,
            elementRect?: DOMRect,
        ): { x: number; y: number } => {
            const elementWidth = elementRect?.width ?? 300;
            const elementHeight = elementRect?.height ?? 200;

            switch (corner) {
                case 'top-left':
                    return { x: pos.x - margin, y: pos.y - margin };
                case 'top-right':
                    return {
                        x: pos.x - (windowWidth - elementWidth - margin),
                        y: pos.y - margin,
                    };
                case 'bottom-left':
                    return {
                        x: pos.x - margin,
                        y: pos.y - (windowHeight - elementHeight - margin),
                    };
                case 'bottom-right':
                    return {
                        x: pos.x - (windowWidth - elementWidth - margin),
                        y: pos.y - (windowHeight - elementHeight - margin),
                    };
                default:
                    return { x: 0, y: 0 };
            }
        },
        [margin],
    );

    const getPositionFromCornerOffset = useCallback(
        (
            corner: Corner,
            offset: { x: number; y: number },
            windowWidth: number,
            windowHeight: number,
            elementRect?: DOMRect,
        ): { x: number; y: number } => {
            const elementWidth = elementRect?.width ?? 300;
            const elementHeight = elementRect?.height ?? 200;

            switch (corner) {
                case 'top-left':
                    return { x: margin + offset.x, y: margin + offset.y };
                case 'top-right':
                    return {
                        x: windowWidth - elementWidth - margin + offset.x,
                        y: margin + offset.y,
                    };
                case 'bottom-left':
                    return {
                        x: margin + offset.x,
                        y: windowHeight - elementHeight - margin + offset.y,
                    };
                case 'bottom-right':
                    return {
                        x: windowWidth - elementWidth - margin + offset.x,
                        y: windowHeight - elementHeight - margin + offset.y,
                    };
                default:
                    return position;
            }
        },
        [margin, position],
    );

    useEffect(() => {
        if (!isEnabled || elementRef.current == null) {
            setAnchoredPosition(position);
            return;
        }

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementRect = elementRef.current.getBoundingClientRect();

        const closestCorner = calculateClosestCorner(
            position,
            windowWidth,
            windowHeight,
        );
        const newOffset = calculateOffsetFromCorner(
            position,
            closestCorner,
            windowWidth,
            windowHeight,
            elementRect,
        );

        setCurrentCorner(closestCorner);
        setCornerOffset(newOffset);
        setAnchoredPosition(position);
    }, [
        isEnabled,
        position,
        elementRef,
        calculateClosestCorner,
        calculateOffsetFromCorner,
    ]);

    useEffect(() => {
        if (!isEnabled) return;

        const handleResize = () => {
            if (elementRef.current == null) return;
            const newWindowWidth = window.innerWidth;
            const newWindowHeight = window.innerHeight;
            const elementRect = elementRef.current.getBoundingClientRect();

            const newPosition = getPositionFromCornerOffset(
                currentCorner,
                cornerOffset,
                newWindowWidth,
                newWindowHeight,
                elementRect,
            );

            const constrainedPosition = {
                x: Math.max(
                    10,
                    Math.min(newWindowWidth - elementRect.width, newPosition.x),
                ),
                y: Math.max(
                    0,
                    Math.min(
                        newWindowHeight - elementRect.height,
                        newPosition.y,
                    ),
                ),
            };

            setAnchoredPosition(constrainedPosition);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [
        isEnabled,
        currentCorner,
        cornerOffset,
        elementRef,
        getPositionFromCornerOffset,
    ]);

    return {
        anchoredPosition,
        currentCorner,
    };
}
