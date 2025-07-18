import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDraggablePositionOptions {
    isEnabled?: boolean;
    onPositionChange?: (position: { x: number; y: number }) => void;
    constrainToViewport?: boolean;
    elementRef: React.RefObject<HTMLElement | null>;
}

interface UseDraggablePositionReturn {
    position: { x: number; y: number };
    isDragging: boolean;
    hasDragged: boolean;
    onPointerDown: (event: React.PointerEvent) => void;
    setPosition: (position: { x: number; y: number }) => void;
}

type Point = {
    x: number;
    y: number;
};

const VIEWPORT_MARGIN = 10;

export function useDraggablePosition({
    isEnabled = true,
    onPositionChange,
    constrainToViewport = false,
    elementRef,
}: UseDraggablePositionOptions): UseDraggablePositionReturn {
    const [position, setPositionState] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragStartPos = useRef<Point | null>(null);
    const elementStartPos = useRef<Point | null>(null);

    const setPosition = useCallback(
        (newPosition: { x: number; y: number }) => {
            let constrainedPosition = newPosition;

            if (constrainToViewport) {
                const elementRect = elementRef.current?.getBoundingClientRect();

                if (elementRect == null) {
                    throw new Error(
                        'Element ref in setPosition of useDraggablePosition',
                    );
                }
                constrainedPosition = {
                    x: Math.max(
                        10,
                        Math.min(
                            window.innerWidth -
                                elementRect.width -
                                VIEWPORT_MARGIN,
                            newPosition.x,
                        ),
                    ),
                    y: Math.max(
                        10,
                        Math.min(
                            window.innerHeight -
                                elementRect.height -
                                VIEWPORT_MARGIN,
                            newPosition.y,
                        ),
                    ),
                };
            }

            setPositionState(constrainedPosition);
            onPositionChange?.(constrainedPosition);
        },
        [constrainToViewport, onPositionChange, elementRef],
    );

    const onPointerDown = useCallback(
        (event: React.PointerEvent) => {
            if (!isEnabled) return;

            event.preventDefault();
            event.stopPropagation();

            event.currentTarget.setPointerCapture(event.pointerId);

            setIsDragging(true);
            dragStartPos.current = { x: event.clientX, y: event.clientY };

            const elementRect = elementRef.current?.getBoundingClientRect();

            if (elementRect == null) {
                throw new Error(
                    'Element ref in handleMouseDown of useDraggablePosition',
                );
            }

            elementStartPos.current = elementRect;
        },
        [isEnabled, elementRef],
    );

    const onPointerMove = useCallback(
        (event: PointerEvent) => {
            if (
                !isDragging ||
                !dragStartPos.current ||
                !elementStartPos.current
            )
                return;

            const deltaX = event.clientX - dragStartPos.current.x;
            const deltaY = event.clientY - dragStartPos.current.y;

            const newPosition = {
                x: elementStartPos.current.x + deltaX,
                y: elementStartPos.current.y + deltaY,
            };

            setPosition(newPosition);
            if (!hasDragged) {
                setHasDragged(true);
            }
        },
        [isDragging, setPosition, hasDragged],
    );

    const onPointerUp = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        dragStartPos.current = null;
        elementStartPos.current = null;
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);

            return () => {
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
            };
        }
    }, [isDragging, onPointerMove, onPointerUp]);

    return {
        position,
        isDragging,
        hasDragged,
        onPointerDown: onPointerDown,
        setPosition,
    };
}
